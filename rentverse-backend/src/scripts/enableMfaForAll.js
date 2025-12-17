const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableMfaForAll() {
    const result = await prisma.user.updateMany({
        data: { mfaEnabled: true }
    });
    console.log(`✅ Enabled MFA for ${result.count} users`);
    await prisma.$disconnect();
}

enableMfaForAll();
