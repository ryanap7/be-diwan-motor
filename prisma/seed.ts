import { PrismaClient, UserRole, BranchStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

async function main() {
    console.log('🌱 Starting seed...');

    // Clean database
    console.log('🧹 Cleaning database...');
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
            email: 'admin@company.com',
            fullName: 'System Administrator',
            phone: '081234567890',
            role: UserRole.ADMIN,
            isActive: true,
        },
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // ==========================================
    // CREATE BRANCH MANAGERS
    // ==========================================
    console.log('👔 Creating branch managers...');
    const managers = await Promise.all([
        prisma.user.create({
            data: {
                username: 'manager_jakarta',
                password: await hashPassword('Manager123!'),
                email: 'manager.jakarta@company.com',
                fullName: 'Budi Santoso',
                phone: '081234567891',
                role: UserRole.BRANCH_MANAGER,
                isActive: true,
            },
        }),
        prisma.user.create({
            data: {
                username: 'manager_bandung',
                password: await hashPassword('Manager123!'),
                email: 'manager.bandung@company.com',
                fullName: 'Siti Rahayu',
                phone: '081234567892',
                role: UserRole.BRANCH_MANAGER,
                isActive: true,
            },
        }),
        prisma.user.create({
            data: {
                username: 'manager_surabaya',
                password: await hashPassword('Manager123!'),
                email: 'manager.surabaya@company.com',
                fullName: 'Ahmad Wijaya',
                phone: '081234567893',
                role: UserRole.BRANCH_MANAGER,
                isActive: true,
            },
        }),
    ]);
    console.log(`✅ Created ${managers.length} managers`);

    // ==========================================
    // CREATE CASHIERS
    // ==========================================
    console.log('💰 Creating cashiers...');
    const cashiers = await Promise.all([
        prisma.user.create({
            data: {
                username: 'cashier_jakarta',
                password: await hashPassword('Cashier123!'),
                email: 'cashier.jakarta@company.com',
                fullName: 'Dewi Lestari',
                phone: '081234567894',
                role: UserRole.CASHIER,
                isActive: true,
            },
        }),
        prisma.user.create({
            data: {
                username: 'cashier_bandung',
                password: await hashPassword('Cashier123!'),
                email: 'cashier.bandung@company.com',
                fullName: 'Rina Marlina',
                phone: '081234567895',
                role: UserRole.CASHIER,
                isActive: true,
            },
        }),
        prisma.user.create({
            data: {
                username: 'cashier_surabaya',
                password: await hashPassword('Cashier123!'),
                email: 'cashier.surabaya@company.com',
                fullName: 'Andi Prasetyo',
                phone: '081234567896',
                role: UserRole.CASHIER,
                isActive: true,
            },
        }),
    ]);
    console.log(`✅ Created ${cashiers.length} cashiers`);

    // ==========================================
    // CREATE BRANCHES WITH FULL FLOW
    // ==========================================
    console.log('🏢 Creating branches...');

    // Sample operating hours
    const defaultOperatingHours = {
        monday: { open: '08:00', close: '17:00', closed: false },
        tuesday: { open: '08:00', close: '17:00', closed: false },
        wednesday: { open: '08:00', close: '17:00', closed: false },
        thursday: { open: '08:00', close: '17:00', closed: false },
        friday: { open: '08:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '15:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
    };

    // BRANCH 1: Jakarta (ACTIVE - Complete)
    const branchJakarta = await prisma.branch.create({
        data: {
            code: 'JKT-001',
            name: 'Cabang Jakarta Pusat',
            address: 'Jl. Sudirman No. 123, Jakarta Pusat',
            city: 'Jakarta',
            province: 'DKI Jakarta',
            postalCode: '10110',
            phone: '0212345678',
            email: 'jakarta@company.com',
            operatingHours: defaultOperatingHours,
            status: BranchStatus.ACTIVE,
            isActive: true,
            managerId: managers[0].id,
            cashierId: cashiers[0].id,
            activatedAt: new Date(),
            notes: 'Cabang utama di Jakarta',
        },
    });

    // Update users to be assigned to Jakarta branch
    await prisma.user.update({
        where: { id: managers[0].id },
        data: { branchId: branchJakarta.id },
    });
    await prisma.user.update({
        where: { id: cashiers[0].id },
        data: { branchId: branchJakarta.id },
    });

    console.log(`✅ Branch Jakarta created (ACTIVE)`);

    // BRANCH 2: Bandung (ACTIVE - Complete)
    const branchBandung = await prisma.branch.create({
        data: {
            code: 'BDG-001',
            name: 'Cabang Bandung',
            address: 'Jl. Dago No. 456, Bandung',
            city: 'Bandung',
            province: 'Jawa Barat',
            postalCode: '40135',
            phone: '0227654321',
            email: 'bandung@company.com',
            operatingHours: defaultOperatingHours,
            status: BranchStatus.ACTIVE,
            isActive: true,
            managerId: managers[1].id,
            cashierId: cashiers[1].id,
            activatedAt: new Date(),
            notes: 'Cabang di kota kembang',
        },
    });

    await prisma.user.update({
        where: { id: managers[1].id },
        data: { branchId: branchBandung.id },
    });
    await prisma.user.update({
        where: { id: cashiers[1].id },
        data: { branchId: branchBandung.id },
    });

    console.log(`✅ Branch Bandung created (ACTIVE)`);

    // BRANCH 3: Surabaya (PENDING - Has manager and cashier but not activated)
    const branchSurabaya = await prisma.branch.create({
        data: {
            code: 'SBY-001',
            name: 'Cabang Surabaya',
            address: 'Jl. Pemuda No. 789, Surabaya',
            city: 'Surabaya',
            province: 'Jawa Timur',
            postalCode: '60271',
            phone: '0319876543',
            email: 'surabaya@company.com',
            operatingHours: defaultOperatingHours,
            status: BranchStatus.PENDING,
            isActive: false,
            managerId: managers[2].id,
            cashierId: cashiers[2].id,
            notes: 'Menunggu aktivasi dari pusat',
        },
    });

    await prisma.user.update({
        where: { id: managers[2].id },
        data: { branchId: branchSurabaya.id },
    });
    await prisma.user.update({
        where: { id: cashiers[2].id },
        data: { branchId: branchSurabaya.id },
    });

    console.log(`✅ Branch Surabaya created (PENDING)`);

    // BRANCH 4: Yogyakarta (DRAFT - No manager and cashier)
    await prisma.branch.create({
        data: {
            code: 'YGY-001',
            name: 'Cabang Yogyakarta',
            address: 'Jl. Malioboro No. 100, Yogyakarta',
            city: 'Yogyakarta',
            province: 'DI Yogyakarta',
            postalCode: '55213',
            phone: '0274123456',
            email: 'yogyakarta@company.com',
            operatingHours: defaultOperatingHours,
            status: BranchStatus.DRAFT,
            isActive: false,
            notes: 'Cabang baru, belum lengkap',
        },
    });

    console.log(`✅ Branch Yogyakarta created (DRAFT)`);

    // BRANCH 5: Semarang (INACTIVE - Previously active but deactivated)
    await prisma.branch.create({
        data: {
            code: 'SMG-001',
            name: 'Cabang Semarang',
            address: 'Jl. Pandanaran No. 88, Semarang',
            city: 'Semarang',
            province: 'Jawa Tengah',
            postalCode: '50134',
            phone: '0248765432',
            email: 'semarang@company.com',
            operatingHours: defaultOperatingHours,
            status: BranchStatus.INACTIVE,
            isActive: false,
            activatedAt: new Date('2024-01-01'),
            deactivatedAt: new Date('2024-06-01'),
            notes: 'Dinonaktifkan untuk renovasi',
        },
    });

    console.log(`✅ Branch Semarang created (INACTIVE)`);

    // Create Categories with nested structure
    console.log('📦 Creating categories...');

    // Root Categories
    await prisma.category.create({
        data: {
            name: 'Ban & Velg',
            slug: 'ban-velg',
            description: 'Ban motor dan velg racing',
            sortOrder: 1,
            isActive: true,
        },
    });

    const oliPelumas = await prisma.category.create({
        data: {
            name: 'Oli & Pelumas',
            slug: 'oli-pelumas',
            description: 'Oli mesin, gardan dan pelumas',
            sortOrder: 2,
            isActive: true,
        },
    });

    await prisma.category.create({
        data: {
            name: 'Sistem Rem',
            slug: 'sistem-rem',
            description: 'Kompas rem, cakram, dan kampas',
            sortOrder: 3,
            isActive: true,
        },
    });

    const kelistrikan = await prisma.category.create({
        data: {
            name: 'Kelistrikan',
            slug: 'kelistrikan',
            description: 'Aki, busi, CDI, lampu, klakson',
            sortOrder: 4,
            isActive: true,
        },
    });

    await prisma.category.create({
        data: {
            name: 'Filter',
            slug: 'filter',
            description: 'Filter udara, oli, dan bensin',
            sortOrder: 5,
            isActive: true,
        },
    });

    await prisma.category.create({
        data: {
            name: 'Sistem Transmisi',
            slug: 'sistem-transmisi',
            description: 'Rantai, gear, kopling',
            sortOrder: 6,
            isActive: true,
        },
    });

    await prisma.category.create({
        data: {
            name: 'Body & Aksesoris',
            slug: 'body-aksesoris',
            description: 'Spion, jok, knalpot, windshield',
            sortOrder: 7,
            isActive: true,
        },
    });

    // Sub Categories - Oli & Pelumas
    await prisma.category.createMany({
        data: [
            {
                name: 'Oli Mesin',
                slug: 'oli-mesin',
                description: 'Oli untuk mesin motor 4-tak dan 2-tak',
                parentId: oliPelumas.id,
                sortOrder: 1,
            },
            {
                name: 'Oli Gardan',
                slug: 'oli-gardan',
                description: 'Oli untuk gardan motor matic',
                parentId: oliPelumas.id,
                sortOrder: 2,
            },
            {
                name: 'Pelumas',
                slug: 'pelumas',
                description: 'Grease dan pelumas rantai',
                parentId: oliPelumas.id,
                sortOrder: 3,
            },
        ],
    });

    // Sub Categories - Kelistrikan
    await prisma.category.createMany({
        data: [
            {
                name: 'Aki',
                slug: 'aki',
                description: 'Baterai motor kering dan basah',
                parentId: kelistrikan.id,
                sortOrder: 1,
            },
            {
                name: 'Busi',
                slug: 'busi',
                description: 'Busi standar dan racing',
                parentId: kelistrikan.id,
                sortOrder: 2,
            },
            {
                name: 'Lampu',
                slug: 'lampu',
                description: 'Lampu depan, belakang, sein',
                parentId: kelistrikan.id,
                sortOrder: 3,
            },
            {
                name: 'CDI',
                slug: 'cdi',
                description: 'CDI standar dan racing',
                parentId: kelistrikan.id,
                sortOrder: 4,
            },
        ],
    });

    console.log('✅ Categories created successfully');

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n📊 Seeding Summary:');
    console.log('='.repeat(50));
    console.log(`👤 Users created: ${1 + managers.length + cashiers.length}`);
    console.log(`   - Admin: 1`);
    console.log(`   - Managers: ${managers.length}`);
    console.log(`   - Cashiers: ${cashiers.length}`);
    console.log(`\n🏢 Branches created: 5`);
    console.log(`   - ACTIVE: 2 (Jakarta, Bandung)`);
    console.log(`   - PENDING: 1 (Surabaya)`);
    console.log(`   - DRAFT: 1 (Yogyakarta)`);
    console.log(`   - INACTIVE: 1 (Semarang)`);
    console.log('\n🔑 Login Credentials:');
    console.log('='.repeat(50));
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: Admin123!');
    console.log('  Email: admin@company.com');
    console.log('\nBranch Managers:');
    console.log(
        '  Jakarta  - Username: manager_jakarta  | Password: Manager123!'
    );
    console.log(
        '  Bandung  - Username: manager_bandung  | Password: Manager123!'
    );
    console.log(
        '  Surabaya - Username: manager_surabaya | Password: Manager123!'
    );
    console.log('\nCashiers:');
    console.log(
        '  Jakarta  - Username: cashier_jakarta  | Password: Cashier123!'
    );
    console.log(
        '  Bandung  - Username: cashier_bandung  | Password: Cashier123!'
    );
    console.log(
        '  Surabaya - Username: cashier_surabaya | Password: Cashier123!'
    );
    console.log('='.repeat(50));
    console.log('\n✅ Seeding completed successfully!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
