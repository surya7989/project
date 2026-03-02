import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
// Initialize environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/auth', authRoutes); // Auth routes (login, signup, profile)
app.use('/api/products', productRoutes); // Product inventory routes
app.use('/api/users', authRoutes); // Users resource mapping
// Basic Error Handling for JSON Parsing Errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});
// Start Server
app.listen(PORT, () => {
    console.log(`Nexarats POS Backend running on port ${PORT}`);
});
