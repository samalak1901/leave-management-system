import { Router } from 'express';
import { body, param } from 'express-validator';

import {
  applyLeave,
  updateLeaveStatus,
  cancelLeave,
  listLeaves,
  editLeave,
  getLeaveBalance,
  getAllLeaveBalances,
  exportLeaveReport,
  updateLeaveBalance,
  getTeamMembers,
  getLeaveStats,
  exportLeaveBalancesReport,
  exportRoleAnalysis,
  exportMonthlyTrends,
  exportEmployeeDirectory
} from '../controllers/leaveController';

import { authMiddleware, ensureRole } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

// Apply for leave
router.post(
  '/',
  authMiddleware,
  ensureRole(['employee']),
  [
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date'),
    body('type').isIn(['annual', 'sick', 'unpaid']).withMessage('Leave type must be one of annual, sick, or unpaid'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  validateRequest,
  applyLeave
);

// List user's own leaves
router.get(
  '/',
  authMiddleware,
  ensureRole(['employee', 'manager', 'hr']), 
  listLeaves
);

// Cancel leave
router.patch(
  '/cancel/:leaveId',
  authMiddleware,
  ensureRole(['employee']),
  [
    param('leaveId').isMongoId().withMessage('Invalid leave ID'),
  ],
  validateRequest,
  cancelLeave
);

// Edit leave
router.patch(
  '/edit/:leaveId',
  authMiddleware,
  ensureRole(['employee']),
  [
    param('leaveId').isMongoId().withMessage('Invalid leave ID'),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    body('leaveType').optional().isString().withMessage('Leave type must be a string'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  validateRequest,
  editLeave
);

// Get user's leave balance
router.get(
  '/balance',
  authMiddleware,
  ensureRole(['employee']),
  getLeaveBalance
);


// Approve/reject leave
router.patch(
  '/update/:leaveId',
  authMiddleware,
  ensureRole(['manager', 'hr']),
  [
    param('leaveId').isMongoId().withMessage('Invalid leave ID'),
    body('status').isIn(['approved', 'rejected', 'pending']).withMessage('Invalid status'),
    body('remarks').optional().isString().withMessage('Remarks must be a string'),
  ],
  validateRequest,
  updateLeaveStatus
);

// Export leave report
router.get(
  '/admin/export',
  authMiddleware,
  ensureRole(['hr']),
  exportLeaveReport
);

// Get all users' leave balances
router.get(
  '/admin/balances',
  authMiddleware,
  ensureRole(['hr']),
  getAllLeaveBalances
);

// Update leave balance for a user
router.patch(
  '/admin/balances/:userId',
  authMiddleware,
  ensureRole(['hr']),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('leaveType').notEmpty().withMessage('Leave type is required'),
    body('balance').isNumeric().withMessage('Balance must be a number'),
  ],
  validateRequest,
  updateLeaveBalance
);


// Get leave stats
router.get(
  '/stats',
  authMiddleware,
  ensureRole(['employee', 'manager', 'hr', 'admin']),
  getLeaveStats
);

// Get team members (for managers)
router.get(
  '/team-members',
  authMiddleware,
  ensureRole(['manager']),
  getTeamMembers
);

// Export reports (HR only)
router.get(
  '/admin/export-balances',
  authMiddleware,
  ensureRole(['hr']),
  exportLeaveBalancesReport
);

router.get(
  '/admin/export-role-analysis',
  authMiddleware,
  ensureRole(['hr']),
  exportRoleAnalysis
);

router.get(
  '/admin/export-monthly-trends',
  authMiddleware,
  ensureRole(['hr']),
  exportMonthlyTrends
);

router.get(
  '/admin/export-employee-directory',
  authMiddleware,
  ensureRole(['hr']),
  exportEmployeeDirectory
);

export default router;