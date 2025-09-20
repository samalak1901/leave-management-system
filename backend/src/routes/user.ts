import express from 'express';
import { body, param } from 'express-validator';
import {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  createEmployee,
  getEmployeeCount,
  getManagers
} from '../controllers/userControllers';

import { authMiddleware, ensureRole } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';

const router = express.Router();

router.use(authMiddleware);
router.use(ensureRole(['hr']));

router.get('/', getEmployees);

router.get('/count', getEmployeeCount);

router.get('/managers', getManagers);

router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid employee ID'),
    validateRequest,
  ],
  getEmployeeById
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid employee ID'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('role').optional().isIn(['employee', 'manager', 'hr']).withMessage('Invalid role'),
    validateRequest,
  ],
  updateEmployee
);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(['employee', 'manager', 'hr']).withMessage('Role must be employee, manager, or hr'),
    validateRequest,
  ],
  createEmployee
);

export default router;