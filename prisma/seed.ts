import { PrismaClient, UserRole, BranchStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

async function main() {
    console.log('🌱 Starting HD Motopart seed...');

    // Clean database
    console.log('🧹 Cleaning database...');
    await prisma.stockMovement.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.product.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Database cleaned');

    // ==========================================
    // CREATE ADMIN USER
    // ==========================================
    console.log('👤 Creating admin user...');
    const admin = await prisma.user.create({
        data: {
            username: 'admin',
            password: await hashPassword('Admin123!'),
            email: 'admin@hdmotopart.com',
            fullName: 'System Administrator',
            phone: '081234567890',
            role: UserRole.ADMIN,
            isActive: true,
        },
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // ==========================================
    // CREATE BRANCH MANAGER
    // ==========================================
    console.log('👔 Creating branch manager...');
    const manager = await prisma.user.create({
        data: {
            username: 'manager_hd',
            password: await hashPassword('Manager123!'),
            email: 'manager@hdmotopart.com',
            fullName: 'Bambang Sutrisno',
            phone: '081234567891',
            role: UserRole.BRANCH_MANAGER,
            isActive: true,
        },
    });
    console.log(`✅ Manager created: ${manager.email}`);

    // ==========================================
    // CREATE CASHIER
    // ==========================================
    console.log('💰 Creating cashier...');
    const cashier = await prisma.user.create({
        data: {
            username: 'cashier_hd',
            password: await hashPassword('Cashier123!'),
            email: 'cashier@hdmotopart.com',
            fullName: 'Sinta Wijaya',
            phone: '081234567892',
            role: UserRole.CASHIER,
            isActive: true,
        },
    });
    console.log(`✅ Cashier created: ${cashier.email}`);

    // ==========================================
    // CREATE BRANCH
    // ==========================================
    console.log('🏢 Creating branch...');

    const defaultOperatingHours = {
        monday: { open: '08:00', close: '17:00', closed: false },
        tuesday: { open: '08:00', close: '17:00', closed: false },
        wednesday: { open: '08:00', close: '17:00', closed: false },
        thursday: { open: '08:00', close: '17:00', closed: false },
        friday: { open: '08:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '15:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
    };

    const branch = await prisma.branch.create({
        data: {
            code: 'HD-001',
            name: 'HD Motopart',
            address: 'Jl. Merdeka No. 123, Bandung',
            city: 'Bandung',
            province: 'Jawa Barat',
            postalCode: '40123',
            phone: '0227654321',
            email: 'info@hdmotopart.com',
            operatingHours: defaultOperatingHours,
            status: BranchStatus.ACTIVE,
            isActive: true,
            managerId: manager.id,
            cashierId: cashier.id,
            activatedAt: new Date(),
            notes: 'Cabang utama HD Motopart',
        },
    });

    await prisma.user.update({
        where: { id: manager.id },
        data: { branchId: branch.id },
    });

    await prisma.user.update({
        where: { id: cashier.id },
        data: { branchId: branch.id },
    });

    console.log(`✅ Branch created: ${branch.name}`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n📊 Seeding Summary:');
    console.log('='.repeat(70));
    console.log('👤 Users: 3');
    console.log('   - Admin: 1');
    console.log('   - Branch Manager: 1');
    console.log('   - Cashier: 1');
    console.log('\n🏢 Branches: 1');
    console.log('   - HD Motopart (ACTIVE)');

    console.log('\n🔑 Login Credentials:');
    console.log('='.repeat(70));
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: Admin123!');
    console.log('  Email: admin@hdmotopart.com');
    console.log('\nBranch Manager:');
    console.log('  Username: manager_hd');
    console.log('  Password: Manager123!');
    console.log('  Email: manager@hdmotopart.com');
    console.log('\nCashier:');
    console.log('  Username: cashier_hd');
    console.log('  Password: Cashier123!');
    console.log('  Email: cashier@hdmotopart.com');
    console.log('='.repeat(70));

    console.log('\n✅ HD Motopart seeding finished successfully!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
