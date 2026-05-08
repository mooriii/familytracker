import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';
import { io } from '../index';

const router = Router();

const postLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  batteryPct: z.number().int().min(0).max(100).optional(),
});

// POST /location — child sends their current position
router.post('/', requireAuth, requireRole('CHILD'), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = postLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ data: null, error: parsed.error.flatten() });
    return;
  }

  const { lat, lng, accuracy, batteryPct } = parsed.data;
  const userId = req.user!.userId;
  const familyId = req.user!.familyId;

  const location = await prisma.location.create({
    data: { userId, lat, lng, accuracy, batteryPct },
  });

  // Auto-delete locations older than 30 days for this user
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await prisma.location.deleteMany({
    where: { userId, recordedAt: { lt: cutoff } },
  });

  // Broadcast to all family members in the socket room
  if (familyId) {
    io.to(`family:${familyId}`).emit('location:update', {
      userId,
      lat,
      lng,
      accuracy,
      batteryPct,
      recordedAt: location.recordedAt,
    });
  }

  res.status(201).json({ data: location, error: null });
});

// GET /location/:userId/latest — get most recent location for a family member
router.get('/:userId/latest', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  // Verify the requested user is in the same family
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser || targetUser.familyId !== req.user!.familyId) {
    res.status(403).json({ data: null, error: 'Access denied' });
    return;
  }

  const location = await prisma.location.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  });

  res.json({ data: location ?? null, error: null });
});

// GET /location/:userId/history?hours=24 — get location trail
router.get('/:userId/history', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const hours = Math.min(Number(req.query.hours ?? 24), 720); // max 30 days

  // Verify same family
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser || targetUser.familyId !== req.user!.familyId) {
    res.status(403).json({ data: null, error: 'Access denied' });
    return;
  }

  const since = new Date();
  since.setHours(since.getHours() - hours);

  const locations = await prisma.location.findMany({
    where: { userId, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
  });

  res.json({ data: locations, error: null });
});

// GET /location/family/all — parent gets latest location for every child
router.get('/family/all', requireAuth, requireRole('PARENT'), async (req: AuthRequest, res: Response): Promise<void> => {
  const familyId = req.user!.familyId;
  if (!familyId) {
    res.status(400).json({ data: null, error: 'No family associated' });
    return;
  }

  const children = await prisma.user.findMany({
    where: { familyId, role: 'CHILD' },
  });

  const results = await Promise.all(
    children.map(async (child) => {
      const latest = await prisma.location.findFirst({
        where: { userId: child.id },
        orderBy: { recordedAt: 'desc' },
      });
      return {
        user: { id: child.id, name: child.name },
        location: latest ?? null,
      };
    })
  );

  res.json({ data: results, error: null });
});

export default router;
