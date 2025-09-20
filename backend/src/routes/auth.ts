import { Router } from 'express';
import { body } from 'express-validator';
import { login, refresh, me } from '../controllers/authControllers';
import { validateRequest } from '../middlewares/validateRequest';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

router.get('/me', me);

router.post('/refresh', refresh);

export default router;