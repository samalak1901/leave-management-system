import { Schema, model, Types } from 'mongoose';
import { Role } from './User';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'annual' | 'sick' | 'unpaid';

export interface IAudit {
    action: string;
    by: Types.ObjectId;
    at: Date;
    meta?: any;
}

export interface ILeaveRequest {
    userId: Types.ObjectId;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: LeaveStatus;
    managerId?: Types.ObjectId | null;
    hrOverride?: boolean;
    comments?: string;
    auditTrail: IAudit[];
    createdAt?: Date;
    updatedAt?: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['annual', 'sick', 'unpaid'], required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String, required: true },
        status: { 
            type: String, 
            enum: ['pending', 'approved', 'rejected', 'cancelled'], 
            default: 'pending' 
        },
        managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        hrOverride: { type: Boolean, default: false },
        comments: { type: String, default: '' },
        auditTrail: [
            {
                action: String,
                by: { type: Schema.Types.ObjectId, ref: 'User' },
                at: { type: Date, default: Date.now },
                meta: Schema.Types.Mixed,
            },
        ],
    },
    { timestamps: true }
);

LeaveRequestSchema.index({ userId: 1, createdAt: -1 });

export const LeaveRequest = model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);