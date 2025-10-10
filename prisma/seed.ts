import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Start seeding...');

    // Clean database
    await prisma.salesOrderItem.deleteMany();
    await prisma.salesOrder.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Database cleaned');

    // Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@bengkel.com',
            name: 'Admin Bengkel',
            password: hashedPassword,
            phone: '081234567890',
            role: 'ADMIN',
        },
    });

    const manager = await prisma.user.create({
        data: {
            email: 'manager@bengkel.com',
            name: 'Manager Bengkel',
            password: hashedPassword,
            phone: '081234567891',
            role: 'MANAGER',
        },
    });

    const staff = await prisma.user.create({
        data: {
            email: 'staff@bengkel.com',
            name: 'Staff Bengkel',
            password: hashedPassword,
            phone: '081234567892',
            role: 'STAFF',
        },
    });

    console.log('✅ Users created');

    // Create Categories
    const categories = await Promise.all([
        prisma.category.create({
            data: {
                name: 'Oli & Pelumas',
                slug: 'oli-pelumas',
                description: 'Oli mesin, oli transmisi, dan pelumas lainnya',
            },
        }),
        prisma.category.create({
            data: {
                name: 'Spare Part Mesin',
                slug: 'spare-part-mesin',
                description: 'Komponen mesin kendaraan',
            },
        }),
        prisma.category.create({
            data: {
                name: 'Ban & Velg',
                slug: 'ban-velg',
                description: 'Ban, velg, dan aksesoris roda',
            },
        }),
        prisma.category.create({
            data: {
                name: 'Aki & Baterai',
                slug: 'aki-baterai',
                description: 'Aki, baterai, dan komponen kelistrikan',
            },
        }),
    ]);

    console.log('✅ Categories created');

    // Create Suppliers
    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: {
                code: 'SUP-001',
                name: 'PT Astra Otoparts',
                email: 'sales@astra-otoparts.com',
                phone: '021-12345678',
                address: 'Jl. Raya Jakarta No. 123',
                city: 'Jakarta',
                province: 'DKI Jakarta',
                postalCode: '12345',
                contactPerson: 'Budi Santoso',
            },
        }),
        prisma.supplier.create({
            data: {
                code: 'SUP-002',
                name: 'CV Maju Jaya Motor',
                email: 'info@majujaya.com',
                phone: '022-87654321',
                address: 'Jl. Industri No. 45',
                city: 'Bandung',
                province: 'Jawa Barat',
                postalCode: '40123',
                contactPerson: 'Andi Wijaya',
            },
        }),
    ]);

    console.log('✅ Suppliers created');

    // Create Products
    const products = await Promise.all([
        prisma.product.create({
            data: {
                sku: 'OLI-001',
                name: 'Oli Mesin Shell Helix HX7 10W-40',
                slug: 'oli-mesin-shell-helix-hx7-10w-40',
                description: 'Oli mesin sintetik untuk kendaraan bensin',
                categoryId: categories[0].id,
                costPrice: 85000,
                sellingPrice: 120000,
                currentStock: 50,
                minimumStock: 10,
                maximumStock: 100,
                unit: 'liter',
                brand: 'Shell',
                location: 'Rak A-1',
            },
        }),
        prisma.product.create({
            data: {
                sku: 'SPM-001',
                name: 'Filter Oli Toyota Avanza',
                slug: 'filter-oli-toyota-avanza',
                description: 'Filter oli original untuk Toyota Avanza',
                categoryId: categories[1].id,
                costPrice: 35000,
                sellingPrice: 50000,
                currentStock: 30,
                minimumStock: 5,
                unit: 'pcs',
                brand: 'Toyota',
                model: 'Avanza',
                location: 'Rak B-2',
            },
        }),
        prisma.product.create({
            data: {
                sku: 'BAN-001',
                name: 'Ban Bridgestone Turanza 185/65 R15',
                slug: 'ban-bridgestone-turanza-185-65-r15',
                description: 'Ban mobil ukuran 185/65 R15',
                categoryId: categories[2].id,
                costPrice: 650000,
                sellingPrice: 850000,
                currentStock: 20,
                minimumStock: 4,
                unit: 'pcs',
                brand: 'Bridgestone',
                location: 'Gudang Ban',
            },
        }),
        prisma.product.create({
            data: {
                sku: 'AKI-001',
                name: 'Aki GS Astra NS60L 12V 45Ah',
                slug: 'aki-gs-astra-ns60l-12v-45ah',
                description: 'Aki basah untuk mobil',
                categoryId: categories[3].id,
                costPrice: 550000,
                sellingPrice: 750000,
                currentStock: 15,
                minimumStock: 3,
                unit: 'pcs',
                brand: 'GS Astra',
                location: 'Rak C-1',
            },
        }),
    ]);

    console.log('✅ Products created');

    // Create Customers
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                code: 'CUST-001',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '081234567893',
                address: 'Jl. Merdeka No. 10',
                city: 'Jakarta',
                province: 'DKI Jakarta',
            },
        }),
        prisma.customer.create({
            data: {
                code: 'CUST-002',
                name: 'Jane Smith',
                phone: '081234567894',
                address: 'Jl. Sudirman No. 20',
                city: 'Bandung',
                province: 'Jawa Barat',
            },
        }),
    ]);

    console.log('✅ Customers created');

    console.log('🎉 Seeding completed!');
    console.log('\n📋 Default Users:');
    console.log('Admin: admin@bengkel.com / password123');
    console.log('Manager: manager@bengkel.com / password123');
    console.log('Staff: staff@bengkel.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
