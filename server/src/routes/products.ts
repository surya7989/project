import express, { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all products (paginated)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100; // Larger default limit for POS usage
    const skip = (page - 1) * limit;

    try {
        const products = await prisma.product.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const total = await prisma.product.count();

        res.json({
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Fetch products error:', error);
        res.status(500).json({ error: 'Server error fetching products' });
    }
});

// GET one product
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
        });

        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// CREATE product
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.create({
            data: req.body,
        });
        res.status(201).json(product);
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'SKU must be unique' });
        res.status(500).json({ error: 'Server error creating product' });
    }
});

// UPDATE product
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating product' });
    }
});

// BULK update products
router.put('/bulk/update', authenticateToken, async (req: Request, res: Response) => {
    const { products } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'Array of products required' });

    try {
        const updates = products.map((u: any) =>
            prisma.product.update({
                where: { id: u.id },
                data: u,
            })
        );

        const result = await prisma.$transaction(updates);
        res.json(result);
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ error: 'Server error in bulk update' });
    }
});

// SEED products
router.post('/seed', authenticateToken, async (req: Request, res: Response) => {
    const { products } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'Array of products required' });

    try {
        const newProducts = products.map((p: any) => ({
            ...p,
            id: p.id || undefined, // Allow Prisma to generate UUID if needed, but here we likely want to keep the IDs if provided
        }));

        // For seeding, we might want to skip existing SKUs or error out
        const result = await prisma.product.createMany({
            data: newProducts,
            skipDuplicates: true,
        });

        const allProducts = await prisma.product.findMany();
        res.json({ success: true, count: result.count, products: allProducts });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ error: 'Server error during seeding' });
    }
});

// DELETE product
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id },
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting product' });
    }
});

export default router;
