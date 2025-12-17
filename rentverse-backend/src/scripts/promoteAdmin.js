const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promoteToAdmin() {
    try {
        const user = await prisma.user.update({
            where: { email: 'amirhafizi443@gmail.com' },
            data: { role: 'ADMIN' }
        });
        console.log('✅ Promoted to ADMIN:', user.email, user.role);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

promoteToAdmin();
