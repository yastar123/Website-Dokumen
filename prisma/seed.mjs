import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@gmail.com';
  const plainPassword = '11111111';

  const hash = await bcrypt.hash(plainPassword, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      // Do not overwrite password automatically to avoid surprise; ensure role and active status
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    create: {
      name: 'Super Admin',
      email,
      password: hash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Ensured SUPER ADMIN account exists:', email);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
