import { Schema, model, Types } from 'mongoose';

export type Role = 'employee' | 'manager' | 'hr';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  managerId?: Types.ObjectId | null;
  leaveBalances: {
    annual: number;
    sick: number;
    [key: string]: number; 
  };
  refreshTokenHash?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['employee', 'manager', 'hr'], required: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    leaveBalances: {
      annual: { type: Number, default: 0, min: 0, max: 50 },
      sick: { type: Number, default: 0, min: 0, max: 30 },
    },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  return obj;
};

export const User = model<IUser>('User', UserSchema);