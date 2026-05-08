import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken } from '../lib/jwt';
import { requireAuth, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  familyName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const joinSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  inviteCode: z.string().min(1),
});

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// POST /auth/register — parent creates account + family
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ data: null, error: parsed.error.flatten() });
    return;
  }

  const { name, email, password, familyName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ data: null, error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inviteCode = generateInviteCode();

  const family = await prisma.family.create({
    data: { name: familyName, inviteCode },
  });

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'PARENT', familyId: family.id },
  });

  const payload = { userId: user.id, role: user.role, familyId: user.familyId };
  res.status(201).json({
    data: {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      family: { id: family.id, name: family.name, inviteCode: family.inviteCode },
    },
    error: null,
  });
});

// POST /auth/login — login for both roles
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ data: null, error: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ data: null, error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ data: null, error: 'Invalid email or password' });
    return;
  }

  const payload = { userId: user.id, role: user.role, familyId: user.familyId };
  res.json({
    data: {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
    error: null,
  });
});

// POST /auth/invite — parent regenerates invite code
router.post(
  '/invite',
  requireAuth,
  requireRole('PARENT'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const familyId = req.user!.familyId;
    if (!familyId) {
      res.status(400).json({ data: null, error: 'No family associated with this account' });
      return;
    }

    const inviteCode = generateInviteCode();
    const family = await prisma.family.update({
      where: { id: familyId },
      data: { inviteCode },
    });

    res.json({ data: { inviteCode: family.inviteCode }, error: null });
  }
);

// POST /auth/join — child joins a family with invite code
router.post('/join', async (req: Request, res: Response): Promise<void> => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ data: null, error: parsed.error.flatten() });
    return;
  }

  const { name, email, password, inviteCode } = parsed.data;

  const family = await prisma.family.findUnique({ where: { inviteCode } });
  if (!family) {
    res.status(404).json({ data: null, error: 'Invalid invite code' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ data: null, error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'CHILD', familyId: family.id },
  });

  const payload = { userId: user.id, role: user.role, familyId: user.familyId };
  res.status(201).json({
    data: {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      family: { id: family.id, name: family.name },
    },
    error: null,
  });
});

// GET /auth/me — get current user profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { family: true },
  });

  if (!user) {
    res.status(404).json({ data: null, error: 'User not found' });
    return;
  }

  res.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      family: user.family
        ? { id: user.family.id, name: user.family.name, inviteCode: user.role === 'PARENT' ? user.family.inviteCode : undefined }
        : null,
    },
    error: null,
  });
});

export default router;
