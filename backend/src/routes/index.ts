import { Router } from 'express';
import authRoutes from './auth';
import leaveRoutes from './leave'; 
import userRoutes from "./user"

const router = Router();

router.use('/auth', authRoutes);
router.use('/leaves', leaveRoutes); 
router.use('/users', userRoutes); 

export default router;