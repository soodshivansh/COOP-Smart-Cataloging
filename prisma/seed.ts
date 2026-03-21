import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });

  const viewerPassword = await bcrypt.hash('viewer123', 12);
  await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      passwordHash: viewerPassword,
      role: 'viewer',
    },
  });

  console.log('✅ Seed complete');
  console.log('Admin:  admin@example.com / admin123');
  console.log('Viewer: viewer@example.com / viewer123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
