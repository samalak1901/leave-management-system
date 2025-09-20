import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/User';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES_IN = '1d';

// Sign JWT
const signAccessToken = (user: any) =>
    jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// Create & store refresh token
import crypto from 'crypto';
async function createAndStoreRefreshToken(userId: string) {
    const token = crypto.randomBytes(48).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(token, salt);
    await User.updateOne({ _id: userId }, { refreshTokenHash: hash });
    return token;
}

// Register
export async function register(req: Request, res: Response) {
    try {
        const { name, email, password, role, managerId } = req.body;
        if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already registered' });

        const hash = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            passwordHash: hash,
            role,
            managerId: managerId || null,
            leaveBalances: { annual: 12, sick: 10 },
        });
        await user.save();

        const accessToken = signAccessToken(user);
        const refreshToken = await createAndStoreRefreshToken(user._id.toString());

        res.status(201).json({ user: user.toJSON(), accessToken, refreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

// Login
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });

        const user = await User.findOne({ email }).select('+passwordHash +refreshTokenHash');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

        const accessToken = signAccessToken(user);
        const refreshToken = await createAndStoreRefreshToken(user._id.toString());

        res.json({ user: user.toJSON(), accessToken, refreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}

// GET /auth/me
export async function me(req: Request, res: Response) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };

        const user = await User.findById(decoded.sub).select("-passwordHash -refreshTokenHash");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: "Missing refresh token" });

        const user = await User.findOne({ refreshTokenHash: { $exists: true } }).select("+refreshTokenHash");
        if (!user) return res.status(401).json({ message: "Invalid refresh token" });

        const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash || "");
        if (!valid) return res.status(401).json({ message: "Invalid refresh token" });

        const accessToken = signAccessToken(user);
        const newRefreshToken = await createAndStoreRefreshToken(user._id.toString());

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}