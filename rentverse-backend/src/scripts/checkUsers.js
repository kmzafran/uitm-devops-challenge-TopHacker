const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    // Find recently created users (last 60 minutes)
    const recentUsers = await prisma.user.findMany({
        where: {
            createdAt: {
                gte: new Date(Date.now() - 60 * 60000)
            }
        },
        select: {
            email: true,
            mfaEnabled: true,
            createdAt: true
        }
    });

    console.log('Recent users (last 60 min):', JSON.stringify(recentUsers, null, 2));

    // Also check all users
    const allUsers = await prisma.user.findMany({
        select: {
            email: true,
            mfaEnabled: true
        }
    });

    console.log('\nAll users mfaEnabled status:');
    allUsers.forEach(u => console.log(`  ${u.email}: mfaEnabled = ${u.mfaEnabled}`));

    await prisma.$disconnect();
}

checkUsers();
