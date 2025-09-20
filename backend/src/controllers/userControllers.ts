import { Request, Response } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

export async function createEmployee(req: Request, res: Response) {
  try {
    const { name, email, password, role, managerId, leaveBalances } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['employee', 'manager', 'hr'].includes(role)) {
      return res.status(400).json({ message: 'Role must be employee, manager, or hr' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Use only annual and sick; ignore extra fields
    const finalLeaveBalances = {
      annual: leaveBalances?.annual ?? 25,
      sick: leaveBalances?.sick ?? 15,
    };

    // Validate
    if (finalLeaveBalances.annual < 0 || finalLeaveBalances.annual > 50 ||
        finalLeaveBalances.sick < 0 || finalLeaveBalances.sick > 30) {
      return res.status(400).json({ message: 'Invalid leave balance values (annual: 0-50, sick: 0-30)' });
    }

    const assignedManagerId = role === 'manager' ? null : managerId || null;
    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      passwordHash: hashed,
      role,
      managerId: assignedManagerId,
      leaveBalances: finalLeaveBalances,
    });

    await user.save();

    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}



export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await User.find({ role: { $in: ['employee', 'manager'] } }).select('-passwordHash -refreshTokenHash');
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get employee count for HR/Admin
export const getEmployeeCount = async (req: Request, res: Response) => {
  try {
    const employeeCount = await User.countDocuments({ role: { $in: ['employee', 'manager'] } });
    res.json({ count: employeeCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await User.findById(req.params.id).select('-passwordHash -refreshTokenHash');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { name, email, role, managerId, leaveBalances } = req.body;

    // Validate role
    if (role && !['employee', 'manager', 'hr'].includes(role)) {
      return res.status(400).json({ message: 'Role must be employee, manager, or hr' });
    }

    // Check email uniqueness
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ message: 'Email already exists' });
      }
    }

    // Validate leaveBalances
    if (leaveBalances) {
      const updateBalances = {
        annual: leaveBalances.annual ?? undefined,
        sick: leaveBalances.sick ?? undefined,
      };
      if ((updateBalances.annual !== undefined && (updateBalances.annual < 0 || updateBalances.annual > 50)) ||
          (updateBalances.sick !== undefined && (updateBalances.sick < 0 || updateBalances.sick > 30))) {
        return res.status(400).json({ message: 'Invalid leave balance values (annual: 0-50, sick: 0-30)' });
      }
      req.body.leaveBalances = updateBalances; // Use only valid fields
    }

    // Prepare update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (managerId !== undefined) updateData.managerId = role === 'manager' ? null : managerId || null;
    if (leaveBalances) updateData.leaveBalances = req.body.leaveBalances;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshTokenHash');

    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee updated', user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getManagers = async (req: Request, res: Response) => {
  try {
    const managers = await User.find({ role: 'manager' }).select('-passwordHash -refreshTokenHash');
    res.json(managers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};