import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { LeaveRequest } from '../models/LeaveRequest';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

if (!MONGO_URI) {
  console.error('MONGO_URI not defined in .env');
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    // Clear existing data
    await User.deleteMany({});
    await LeaveRequest.deleteMany({});

    const password = await bcrypt.hash('password123', 10);

    // Create sample users
    const hr = new User({
      name: 'HR User',
      email: 'hr@example.com',
      passwordHash: password,
      role: 'hr',
      leaveBalances: { annual: 20, sick: 20 },
    });

    const manager = new User({
      name: 'Manager User',
      email: 'manager@example.com',
      passwordHash: password,
      role: 'manager',
      leaveBalances: { annual: 15, sick: 15 },
    });

    const employee = new User({
      name: 'Employee User',
      email: 'employee@example.com',
      passwordHash: password,
      role: 'employee',
      managerId: manager._id,
      leaveBalances: { annual: 12, sick: 10 },
    });

    await hr.save();
    await manager.save();
    await employee.save();

    console.log('Sample users created:');
    console.log('HR: hr@example.com / password123');
    console.log('Manager: manager@example.com / password123');
    console.log('Employee: employee@example.com / password123');

    // Optional: Create sample leaves
    const sampleLeave = new LeaveRequest({
      userId: employee._id,
      type: 'annual',
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      reason: 'Vacation',
      status: 'pending',
      auditTrail: [{ action: 'created', by: employee._id, at: new Date() }],
    });

    await sampleLeave.save();
    console.log('Sample leave request created');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();