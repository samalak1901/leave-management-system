import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { LeaveRequest, ILeaveRequest } from '../models/LeaveRequest';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { leaveConfig } from '../config/leaveConfig';
import { Parser } from 'json2csv';

// Calculate total days (with optional business day filter)
function calculateTotalDays(startDate: Date, endDate: Date, businessDaysOnly = leaveConfig.countBusinessDaysOnly): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  let totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

  if (!businessDaysOnly) return totalDays;

  let count = 0;
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}


// Apply for leave
export const applyLeave = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = req.user!;
    const { type, startDate, endDate, reason, emergencyContact, workHandover } = req.body;

    if (!type || !startDate || !endDate || !reason)
      return res.status(400).json({ message: 'Missing required fields' });

    if (type === 'sick' && !emergencyContact)
      return res.status(400).json({ message: 'Emergency contact is required for sick leave' });

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return res.status(400).json({ message: 'Start date cannot be after end date' });

    const totalDays = calculateTotalDays(start, end, false);

    // Check leave balance
    if (type !== 'unpaid' && (user.leaveBalances[type] ?? 0) < totalDays) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient leave balance' });
    }

    // Check overlapping approved leaves
    const overlap = await LeaveRequest.findOne({
      userId: user._id,
      status: 'approved',
      $or: [
        { startDate: { $lte: end, $gte: start } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } },
      ],
    }).session(session);
    if (overlap) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Overlapping leave exists' });
    }

    // Deduct balance
    if (type !== 'unpaid') {
      user.leaveBalances[type] = (user.leaveBalances[type] ?? 0) - totalDays;
      await User.findByIdAndUpdate(user._id, { leaveBalances: user.leaveBalances }, { session });
    }

    const leave = new LeaveRequest({
      userId: user._id,
      type,
      startDate: start,
      endDate: end,
      reason,
      emergencyContact: type === 'sick' ? emergencyContact : '',
      workHandover: workHandover || '',
      status: 'pending',
      auditTrail: [
        {
          action: 'created',
          by: user._id,
          at: new Date(),
          meta: { type, reason, emergencyContact, workHandover, balanceChange: type !== 'unpaid' ? -totalDays : 0 },
        },
      ],
    });

    await leave.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ leave });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Approve / Reject leave (Manager or HR)
export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { leaveId } = req.params;
    const { status, comments } = req.body;
    const user = req.user!;

    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const leave = await LeaveRequest.findById(leaveId).session(session);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    const oldStatus = leave.status;
    const isHR = user.role === 'hr';
    const isManager = user.role === 'manager';

    if (isManager && leave.userId.equals(user._id))
      return res.status(403).json({ message: 'Cannot approve your own leave' });

    if (isHR && !['approved', 'rejected'].includes(oldStatus)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'HR can only override after manager decision' });
    }

    if (isManager && leave.hrOverride) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Cannot override HR decision' });
    }

    const totalDays = calculateTotalDays(leave.startDate, leave.endDate, false);
    const userDoc = await User.findById(leave.userId).session(session);
    if (!userDoc) throw new Error('User not found');

    // Handle leave balance
    if (leave.type !== 'unpaid') {
      if (status === 'rejected' && oldStatus !== 'rejected') {
        userDoc.leaveBalances[leave.type] = (userDoc.leaveBalances[leave.type] ?? 0) + totalDays;
        await userDoc.save({ session });
      }
    }

    leave.status = status;
    leave.comments = comments || '';
    if (isHR) leave.hrOverride = true;

    leave.auditTrail.push({
      action: status,
      by: user._id,
      at: new Date(),
      meta: { comments, balanceChange: status === 'rejected' && leave.type !== 'unpaid' ? totalDays : 0 },
    });

    await leave.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({ leave });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};;


export const cancelLeave = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { leaveId } = req.params;
    const user = req.user!;

    const leave = await LeaveRequest.findOne({ _id: leaveId, userId: user._id }).session(session);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    if (!['pending', 'approved'].includes(leave.status))
      return res.status(400).json({ message: 'Only pending or approved leaves can be cancelled' });

    const totalDays = calculateTotalDays(leave.startDate, leave.endDate, false);

    if (leave.type !== 'unpaid') {
      const userDoc = await User.findById(user._id).session(session);
      if (!userDoc) throw new Error('User not found');
      userDoc.leaveBalances[leave.type] = (userDoc.leaveBalances[leave.type] ?? 0) + totalDays;
      await userDoc.save({ session });
    }

    leave.status = 'cancelled';
    leave.auditTrail.push({
      action: 'cancelled',
      by: user._id,
      at: new Date(),
      meta: { balanceChange: leave.type !== 'unpaid' ? totalDays : 0 },
    });

    await leave.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({ leave });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List leaves
export const listLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, type, from, to } = req.query as { status?: string; type?: string; from?: string; to?: string };

    let filter: any = {};

    if (user.role === 'employee') {
      filter.userId = user._id;
    } else if (user.role === 'manager') {
      const teamMembers = await User.find({ managerId: user._id }).select('_id');
      const teamMemberIds = teamMembers.map(u => u._id);
      filter.userId = { $in: teamMemberIds };
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (from || to) filter.startDate = {};
    if (from) filter.startDate.$gte = new Date(from);
    if (to) filter.startDate.$lte = new Date(to);

    const leaves = await LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json({ leaves });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};




// Update leave (only pending, only employee's own)
export const editLeave = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = req.user!;
    const { leaveId } = req.params;
    const { type, startDate, endDate, reason, emergencyContact, workHandover } = req.body;

    if (!type || !startDate || !endDate || !reason)
      return res.status(400).json({ message: 'Missing required fields' });

    if (type === 'sick' && !emergencyContact)
      return res.status(400).json({ message: 'Emergency contact is required for sick leave' });

    const leave = await LeaveRequest.findOne({ _id: leaveId, userId: user._id }).session(session);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    if (leave.status !== 'pending')
      return res.status(400).json({ message: 'Only pending leaves can be edited' });

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return res.status(400).json({ message: 'Start date cannot be after end date' });

    const totalDays = calculateTotalDays(start, end);
    const oldDays = calculateTotalDays(leave.startDate!, leave.endDate!, false);
    const oldType = leave.type;

    const userDoc = await User.findById(user._id).session(session);
    if (!userDoc) throw new Error('User not found');

    // Restore old balance if non-unpaid
    if (oldType !== 'unpaid') {
      userDoc.leaveBalances[oldType] += oldDays;
    }

    // Check new balance and deduct if non-unpaid
    if (type !== 'unpaid') {
      if (userDoc.leaveBalances[type] < totalDays) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Insufficient leave balance' });
      }
      userDoc.leaveBalances[type] -= totalDays;
    }

    // Prevent overlapping approved leaves (excluding current leave)
    const overlap = await LeaveRequest.findOne({
      userId: user._id,
      status: 'approved',
      _id: { $ne: leave._id },
      $or: [
        { startDate: { $lte: end, $gte: start } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } },
      ],
    }).session(session);
    if (overlap) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Overlapping approved leave exists' });
    }

    // Prevent duplicate pending requests (excluding current leave)
    const duplicatePending = await LeaveRequest.findOne({
      userId: user._id,
      status: 'pending',
      _id: { $ne: leave._id },
      $or: [
        { startDate: { $lte: end, $gte: start } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } },
      ],
    }).session(session);
    if (duplicatePending) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Duplicate pending leave request exists for these dates' });
    }

    // Update leave details
    leave.type = type;
    leave.startDate = start;
    leave.endDate = end;
    leave.reason = reason;
    leave.emergencyContact = type === 'sick' ? emergencyContact : '';
    leave.workHandover = workHandover || '';

    leave.auditTrail.push({
      action: 'edited',
      by: user._id,
      at: new Date(),
      meta: {
        type,
        startDate,
        endDate,
        reason,
        emergencyContact,
        workHandover,
        balanceChange: { oldType, oldDays, newType: type, newDays: totalDays },
      },
    });

    await userDoc.save({ session });
    await leave.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({ leave });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



export const getLeaveBalance = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    res.json({ leaveBalances: user.leaveBalances });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getAllLeaveBalances = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}, 'name email leaveBalances');
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Update leave balance for a specific user
export const updateLeaveBalance = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, amount } = req.body;

    if (!type || typeof amount !== 'number')
      return res.status(400).json({ message: 'Missing type or amount' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If type doesn't exist yet, create it
    if (!user.leaveBalances[type]) user.leaveBalances[type] = 0;

    user.leaveBalances[type] += amount;
    await user.save();

    res.json({ message: 'Leave balance updated', leaveBalances: user.leaveBalances });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



export const exportLeaveReport = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, from, to, role, userId } = req.query;

    let filter: any = {};

    // Apply filters
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (from || to) {
      filter.startDate = {};
      if (from) filter.startDate.$gte = new Date(from as string);
      if (to) filter.startDate.$lte = new Date(to as string);
    }

    // If specific user is requested
    if (userId) {
      filter.userId = userId;
    }
    // If role filter is applied, we need to first find users with that role
    else if (role) {
      const usersWithRole = await User.find({ role }, '_id');
      const userIds = usersWithRole.map(user => user._id);
      filter.userId = { $in: userIds };
    }

    const leaves = await LeaveRequest.find(filter)
      .populate('userId', 'name email role')
      .sort({ startDate: -1 });

    const data = leaves.map(l => ({
      Employee: (l.userId as any).name,
      Email: (l.userId as any).email,
      Role: (l.userId as any).role,
      LeaveType: l.type,
      Status: l.status,
      // Format dates for Excel compatibility
      StartDate: formatDateForExcel(l.startDate),
      EndDate: formatDateForExcel(l.endDate),
      Duration: calculateTotalDays(l.startDate, l.endDate, false),
      Reason: l.reason,
      EmergencyContact: l.emergencyContact || '',
      WorkHandover: l.workHandover || '',
      Comments: l.comments || '',
      // Format dates for Excel compatibility
      AppliedDate: formatDateForExcel(l.createdAt),
      LastUpdated: formatDateForExcel(l.updatedAt)
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`leave-report-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};





// Export employee leave balances with role
export const exportLeaveBalancesReport = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}, 'name email role leaveBalances createdAt');

    const data = users.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      AnnualLeave: user.leaveBalances.annual || 0,
      SickLeave: user.leaveBalances.sick || 0,
      TotalLeave: (user.leaveBalances.annual || 0) + (user.leaveBalances.sick || 0),
      // Format join date for Excel
      JoinDate: formatDateForExcel(user.createdAt)
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('leave-balances-report.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};




// Export employee directory with role
export const exportEmployeeDirectory = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}, 'name email role managerId leaveBalances createdAt');

    // Get manager names for each user
    const usersWithManagers = await Promise.all(users.map(async (user) => {
      let managerName = 'None';
      if (user.managerId) {
        const manager = await User.findById(user.managerId, 'name');
        managerName = manager ? manager.name : 'Unknown';
      }

      return {
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Manager: managerName,
        AnnualLeave: user.leaveBalances.annual || 0,
        SickLeave: user.leaveBalances.sick || 0,
        // Format join date for Excel
        JoinDate: formatDateForExcel(user.createdAt)
      };
    }));

    const parser = new Parser();
    const csv = parser.parse(usersWithManagers);

    res.header('Content-Type', 'text/csv');
    res.attachment('employee-directory.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Format dates for Excel (safe)
function formatDateForExcel(date?: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Export role-based analysis instead of department analysis
export const exportRoleAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    // Group users by role and calculate leave statistics
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          employeeCount: { $sum: 1 },
          totalAnnualLeave: { $sum: '$leaveBalances.annual' },
          totalSickLeave: { $sum: '$leaveBalances.sick' },
          avgAnnualLeave: { $avg: '$leaveBalances.annual' },
          avgSickLeave: { $avg: '$leaveBalances.sick' }
        }
      }
    ]);

    const data = roleStats.map(role => ({
      Role: role._id || 'Unassigned',
      EmployeeCount: role.employeeCount,
      TotalAnnualLeave: role.totalAnnualLeave,
      TotalSickLeave: role.totalSickLeave,
      AverageAnnualLeave: role.avgAnnualLeave.toFixed(2),
      AverageSickLeave: role.avgSickLeave.toFixed(2)
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('role-analysis-report.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



export const exportMonthlyTrends = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    // Get monthly leave request counts with role information
    const monthlyTrends = await LeaveRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(targetYear, 0, 1),
            $lte: new Date(targetYear, 11, 31)
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            role: '$user.role'
          },
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.month': 1, '_id.role': 1 }
      }
    ]);

    // Map month numbers to names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const data = monthlyTrends.map(entry => ({
      Month: monthNames[entry._id.month - 1],
      Role: entry._id.role,
      TotalRequests: entry.totalRequests,
      ApprovedRequests: entry.approvedRequests,
      ApprovalRate: entry.totalRequests > 0
        ? ((entry.approvedRequests / entry.totalRequests) * 100).toFixed(2) + '%'
        : '0%'
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`monthly-trends-${targetYear}.csv`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};




// Get leave statistics for dashboard
export const getLeaveStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let filter: any = {};
    let teamMemberIds: string[] = [];

    // Apply filters based on user role
    if (user.role === 'employee') {
      filter.userId = user._id;
    } else if (user.role === 'manager') {
      // Find users managed by this manager
      const teamMembers = await User.find({ managerId: user._id }).select('_id');
      teamMemberIds = teamMembers.map(u => u._id.toString());
      filter.userId = { $in: teamMemberIds };
    }
    // HR and Admin see all (no userId filter)

    // Get counts for different statuses
    const pendingCount = await LeaveRequest.countDocuments({ ...filter, status: 'pending' });
    const approvedCount = await LeaveRequest.countDocuments({
      ...filter,
      status: 'approved',
      startDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });
    const rejectedCount = await LeaveRequest.countDocuments({
      ...filter,
      status: 'rejected',
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });

    // Calculate total used days for approved leaves
    const approvedLeaves = await LeaveRequest.find({
      ...filter,
      status: 'approved'
    }).select('startDate endDate');

    const totalUsedDays = approvedLeaves.reduce((total, leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + days;
    }, 0);

    // For managers, get team member count
    let teamMemberCount = 0;
    if (user.role === 'manager') {
      teamMemberCount = await User.countDocuments({ managerId: user._id });
    }

    // For HR/Admin, get total employee count
    let totalEmployeeCount = 0;
    if (user.role === 'hr' || user.role === 'admin') {
      totalEmployeeCount = await User.countDocuments({ role: { $in: ['employee', 'manager'] } });
    }

    res.json({
      pendingRequests: pendingCount,
      approvedThisMonth: approvedCount,
      rejectedThisMonth: rejectedCount,
      totalUsedDays,
      teamRequests: user.role === 'manager' ? await LeaveRequest.countDocuments({ userId: { $in: teamMemberIds } }) : 0,
      teamMembers: teamMemberCount,
      totalEmployees: totalEmployeeCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Get team members for managers
export const getTeamMembers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const teamMembers = await User.find({ managerId: user._id }).select('name email leaveBalances');
    res.json({ teamMembers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};