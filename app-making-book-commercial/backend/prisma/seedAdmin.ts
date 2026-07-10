// One-off script to promote an existing user to admin, since there's
// no signup flow that creates admins (nor should there be — anyone
// could just register and tick "isAdmin"). Run once after your first
// real registration:
//   npx ts-node prisma/seedAdmin.ts you@example.com
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: npx ts-node prisma/seedAdmin.ts <email>');
        process.exit(1);
    }

    const user = await prisma.user.update({
        where: { email },
        data: { isAdmin: true },
    });
    console.log(`${user.email} is now an admin.`);
}

main()
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
