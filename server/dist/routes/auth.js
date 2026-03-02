import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nexarats_pos_secret_key_v1';
// Admin Default Permissions (as defined in frontend)
const ADMIN_PERMISSIONS = {
    products: 'manage',
    customers: 'manage',
    vendors: 'manage',
    transactions: 'manage',
    purchases: 'manage',
    users: 'manage',
    settings: 'manage',
    analytics: 'manage'
};
router.post('/signup', async (req, res) => {
    const { name, email, password, phone, role } = req.body;
    try {
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { phone }] }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email or phone already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'Staff'; // Default role is Staff
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                role: userRole,
                permissions: JSON.stringify(ADMIN_PERMISSIONS) // Initialize with basic admin permissions for demo or customize as needed
            }
        });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, permissions: JSON.parse(user.permissions) }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: JSON.parse(user.permissions)
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});
router.post('/login', async (req, res) => {
    const { email, phone, password } = req.body;
    const loginKey = email || phone;
    try {
        const user = await prisma.user.findFirst({
            where: { OR: [{ email: loginKey }, { phone: loginKey }] }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, permissions: JSON.parse(user.permissions) }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: JSON.parse(user.permissions)
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: JSON.parse(user.permissions)
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
export default router;
