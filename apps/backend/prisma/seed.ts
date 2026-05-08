import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.location.deleteMany();
  await prisma.geofence.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();

  const family = await prisma.family.create({
    data: {
      name: 'Test Family',
      inviteCode: 'TEST-1234',
    },
  });

  const parentPassword = await bcrypt.hash('parent123', 10);
  const parent = await prisma.user.create({
    data: {
      name: 'Test Parent',
      email: 'parent@test.com',
      passwordHash: parentPassword,
      role: Role.PARENT,
      familyId: family.id,
    },
  });

  const childPassword = await bcrypt.hash('child123', 10);
  const child = await prisma.user.create({
    data: {
      name: 'Test Child',
      email: 'child@test.com',
      passwordHash: childPassword,
      role: Role.CHILD,
      familyId: family.id,
    },
  });

  await prisma.geofence.create({
    data: {
      familyId: family.id,
      name: 'Home',
      lat: 52.52,
      lng: 13.405,
      radiusMeters: 200,
    },
  });

  await prisma.location.createMany({
    data: [
      { userId: child.id, lat: 52.52, lng: 13.405, batteryPct: 85 },
      { userId: child.id, lat: 52.521, lng: 13.406, batteryPct: 84 },
      { userId: child.id, lat: 52.522, lng: 13.407, batteryPct: 83 },
    ],
  });

  console.log('Seed complete.');
  console.log(`Family: ${family.name} (invite code: ${family.inviteCode})`);
  console.log(`Parent: ${parent.email} / parent123`);
  console.log(`Child:  ${child.email} / child123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
