const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('01223715643', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'tk@admin.com' },
      update: {
        name: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        email: 'tk@admin.com',
        name: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    const student = await prisma.user.upsert({
      where: { email: 'tk2@admin.com' },
      update: {
        name: 'admin2',
        password: hashedPassword,
        role: 'STUDENT',
        isActive: true,
      },
      create: {
        email: 'tk2@admin.com',
        name: 'admin2',
        password: hashedPassword,
        role: 'STUDENT',
        isActive: true,
      },
    });

    console.log('✅ Test accounts created/updated:');
    console.log(`Admin: ${admin.email} / 01223715643`);
    console.log(`Student: ${student.email} / 01223715643`);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
