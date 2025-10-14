import {
    PrismaClient,
    UserRole,
    BranchStatus,
    StockMovementType,
    PurchaseOrderStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

async function main() {
    console.log('🌱 Starting complete seed...');

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
    // CREATE BRANCHES
    // ==========================================
    console.log('🏢 Creating branches...');

    const defaultOperatingHours = {
        monday: { open: '08:00', close: '17:00', closed: false },
        tuesday: { open: '08:00', close: '17:00', closed: false },
        wednesday: { open: '08:00', close: '17:00', closed: false },
        thursday: { open: '08:00', close: '17:00', closed: false },
        friday: { open: '08:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '15:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
    };

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

    await prisma.user.update({
        where: { id: managers[0].id },
        data: { branchId: branchJakarta.id },
    });
    await prisma.user.update({
        where: { id: cashiers[0].id },
        data: { branchId: branchJakarta.id },
    });

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

    console.log(`✅ Created 3 active branches`);

    // ==========================================
    // CREATE CATEGORIES
    // ==========================================
    console.log('📦 Creating categories...');

    const banVelg = await prisma.category.create({
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

    const sistemRem = await prisma.category.create({
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

    const filter = await prisma.category.create({
        data: {
            name: 'Filter',
            slug: 'filter',
            description: 'Filter udara, oli, dan bensin',
            sortOrder: 5,
            isActive: true,
        },
    });

    // Sub Categories
    const oliMesin = await prisma.category.create({
        data: {
            name: 'Oli Mesin',
            slug: 'oli-mesin',
            description: 'Oli untuk mesin motor 4-tak dan 2-tak',
            parentId: oliPelumas.id,
            sortOrder: 1,
        },
    });

    const oliGardan = await prisma.category.create({
        data: {
            name: 'Oli Gardan',
            slug: 'oli-gardan',
            description: 'Oli untuk gardan motor matic',
            parentId: oliPelumas.id,
            sortOrder: 2,
        },
    });

    const aki = await prisma.category.create({
        data: {
            name: 'Aki',
            slug: 'aki',
            description: 'Baterai motor kering dan basah',
            parentId: kelistrikan.id,
            sortOrder: 1,
        },
    });

    const busi = await prisma.category.create({
        data: {
            name: 'Busi',
            slug: 'busi',
            description: 'Busi standar dan racing',
            parentId: kelistrikan.id,
            sortOrder: 2,
        },
    });

    console.log('✅ Categories created');

    // ==========================================
    // CREATE BRANDS
    // ==========================================
    console.log('🏷️ Creating brands...');

    const brands = await Promise.all([
        prisma.brand.create({
            data: {
                name: 'Federal Oil',
                description: 'Pelumas berkualitas Indonesia',
            },
        }),
        prisma.brand.create({
            data: {
                name: 'Castrol',
                description: 'Pelumas premium internasional',
            },
        }),
        prisma.brand.create({
            data: { name: 'Shell', description: 'Oli terpercaya dunia' },
        }),
        prisma.brand.create({
            data: { name: 'NGK', description: 'Busi berkualitas Jepang' },
        }),
        prisma.brand.create({
            data: { name: 'Denso', description: 'Spare part OEM Jepang' },
        }),
        prisma.brand.create({
            data: { name: 'GS Astra', description: 'Aki terpercaya Indonesia' },
        }),
        prisma.brand.create({
            data: { name: 'Yuasa', description: 'Aki premium Jepang' },
        }),
        prisma.brand.create({
            data: { name: 'FDR', description: 'Ban motor lokal berkualitas' },
        }),
        prisma.brand.create({
            data: { name: 'Aspira', description: 'Aksesoris motor AHM' },
        }),
        prisma.brand.create({
            data: { name: 'Nissin', description: 'Sistem rem premium' },
        }),
    ]);

    console.log(`✅ Created ${brands.length} brands`);

    // ==========================================
    // CREATE PRODUCTS
    // ==========================================
    console.log('🛍️ Creating products...');

    const products = await Promise.all([
        // Oli Mesin
        prisma.product.create({
            data: {
                sku: 'OLI-FED-001',
                barcode: '8991234567890',
                name: 'Federal Matic 10W-40',
                slug: 'federal-matic-10w40',
                description:
                    'Oli untuk motor matic, melindungi mesin dan transmisi',
                categoryId: oliMesin.id,
                brandId: brands[0].id,
                unit: 'Liter',
                compatibleModels: 'Vario, Beat, Scoopy, Mio, Nmax',
                purchasePrice: 28000,
                sellingPrice: 35000,
                wholesalePrice: 32000,
                minStock: 20,
                isActive: true,
                isFeatured: true,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'OLI-CAS-001',
                barcode: '8991234567891',
                name: 'Castrol Power1 4T 10W-40',
                slug: 'castrol-power1-10w40',
                description: 'Oli semi synthetic untuk performa maksimal',
                categoryId: oliMesin.id,
                brandId: brands[1].id,
                unit: 'Liter',
                compatibleModels: 'CBR, Ninja, R15, Vixion',
                purchasePrice: 65000,
                sellingPrice: 85000,
                wholesalePrice: 78000,
                minStock: 15,
                isActive: true,
                isFeatured: true,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'OLI-SHL-001',
                barcode: '8991234567892',
                name: 'Shell Advance AX7 10W-40',
                slug: 'shell-advance-ax7',
                description: 'Oli mineral berkualitas tinggi',
                categoryId: oliMesin.id,
                brandId: brands[2].id,
                unit: 'Liter',
                compatibleModels: 'Universal motor 4-tak',
                purchasePrice: 42000,
                sellingPrice: 55000,
                wholesalePrice: 50000,
                minStock: 15,
                isActive: true,
            },
        }),
        // Oli Gardan
        prisma.product.create({
            data: {
                sku: 'OLI-FED-002',
                barcode: '8991234567893',
                name: 'Federal Oil Gear SAE 90',
                slug: 'federal-gear-sae90',
                description: 'Oli gardan untuk motor matic',
                categoryId: oliGardan.id,
                brandId: brands[0].id,
                unit: 'Liter',
                compatibleModels: 'Vario, Beat, Scoopy, Mio, Aerox',
                purchasePrice: 18000,
                sellingPrice: 25000,
                wholesalePrice: 22000,
                minStock: 10,
                isActive: true,
            },
        }),
        // Busi
        prisma.product.create({
            data: {
                sku: 'BSI-NGK-001',
                barcode: '8991234567894',
                name: 'NGK Iridium CPR8EA-9',
                slug: 'ngk-iridium-cpr8ea9',
                description: 'Busi iridium tahan lama dan performa maksimal',
                categoryId: busi.id,
                brandId: brands[3].id,
                unit: 'PCS',
                compatibleModels: 'Vario 150, PCX, ADV',
                purchasePrice: 75000,
                sellingPrice: 95000,
                wholesalePrice: 88000,
                minStock: 20,
                isActive: true,
                isFeatured: true,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'BSI-NGK-002',
                barcode: '8991234567895',
                name: 'NGK Standard C7HSA',
                slug: 'ngk-standard-c7hsa',
                description: 'Busi standar berkualitas',
                categoryId: busi.id,
                brandId: brands[3].id,
                unit: 'PCS',
                compatibleModels: 'Beat, Scoopy, Vario 110',
                purchasePrice: 12000,
                sellingPrice: 18000,
                wholesalePrice: 15000,
                minStock: 30,
                isActive: true,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'BSI-DNS-001',
                barcode: '8991234567896',
                name: 'Denso Iridium IU27',
                slug: 'denso-iridium-iu27',
                description: 'Busi iridium performa tinggi',
                categoryId: busi.id,
                brandId: brands[4].id,
                unit: 'PCS',
                compatibleModels: 'Vario 150, PCX, CBR150',
                purchasePrice: 68000,
                sellingPrice: 88000,
                wholesalePrice: 80000,
                minStock: 15,
                isActive: true,
            },
        }),
        // Aki
        prisma.product.create({
            data: {
                sku: 'AKI-GSA-001',
                barcode: '8991234567897',
                name: 'GS Astra GTZ5S (MF)',
                slug: 'gs-astra-gtz5s',
                description: 'Aki kering maintenance free',
                categoryId: aki.id,
                brandId: brands[5].id,
                unit: 'Unit',
                compatibleModels: 'Vario, Beat, Scoopy, Mio',
                purchasePrice: 165000,
                sellingPrice: 210000,
                wholesalePrice: 195000,
                minStock: 10,
                isActive: true,
                isFeatured: true,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'AKI-YUA-001',
                barcode: '8991234567898',
                name: 'Yuasa YTX5L-BS (MF)',
                slug: 'yuasa-ytx5l-bs',
                description: 'Aki premium Japan technology',
                categoryId: aki.id,
                brandId: brands[6].id,
                unit: 'Unit',
                compatibleModels: 'Vario, Beat, Scoopy',
                purchasePrice: 210000,
                sellingPrice: 270000,
                wholesalePrice: 250000,
                minStock: 8,
                isActive: true,
            },
        }),
        // Ban
        prisma.product.create({
            data: {
                sku: 'BAN-FDR-001',
                barcode: '8991234567899',
                name: 'Ban FDR Sport XR Evo 80/90-14',
                slug: 'fdr-sport-xr-evo-8090-14',
                description: 'Ban tubeless grip maksimal',
                categoryId: banVelg.id,
                brandId: brands[7].id,
                unit: 'PCS',
                compatibleModels: 'Vario, Beat, Scoopy',
                purchasePrice: 145000,
                sellingPrice: 185000,
                wholesalePrice: 170000,
                minStock: 12,
                isActive: true,
            },
        }),
        // Filter
        prisma.product.create({
            data: {
                sku: 'FLT-ASP-001',
                barcode: '8991234567900',
                name: 'Filter Udara Aspira H2-VR15-KZR',
                slug: 'filter-udara-aspira-vario',
                description: 'Filter udara original Honda Vario',
                categoryId: filter.id,
                brandId: brands[8].id,
                unit: 'PCS',
                compatibleModels: 'Vario 150, Vario 125',
                purchasePrice: 32000,
                sellingPrice: 45000,
                wholesalePrice: 40000,
                minStock: 15,
                isActive: true,
            },
        }),
        // Kampas Rem
        prisma.product.create({
            data: {
                sku: 'REM-NIS-001',
                barcode: '8991234567901',
                name: 'Kampas Rem Nissin Depan Vario',
                slug: 'kampas-rem-nissin-vario-depan',
                description: 'Kampas rem cakram depan premium',
                categoryId: sistemRem.id,
                brandId: brands[9].id,
                unit: 'Set',
                compatibleModels: 'Vario 150, Vario 125, PCX',
                purchasePrice: 55000,
                sellingPrice: 75000,
                wholesalePrice: 68000,
                minStock: 10,
                isActive: true,
            },
        }),
        prisma.product.create({
            data: {
                sku: 'REM-ASP-001',
                barcode: '8991234567902',
                name: 'Kampas Rem Aspira Belakang Beat',
                slug: 'kampas-rem-aspira-beat-belakang',
                description: 'Kampas rem tromol belakang',
                categoryId: sistemRem.id,
                brandId: brands[8].id,
                unit: 'Set',
                compatibleModels: 'Beat, Scoopy',
                purchasePrice: 28000,
                sellingPrice: 40000,
                wholesalePrice: 35000,
                minStock: 12,
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Created ${products.length} products`);

    // ==========================================
    // CREATE SUPPLIERS
    // ==========================================
    console.log('🏭 Creating suppliers...');

    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: {
                name: 'PT Astra Otoparts',
                contactPerson: 'Pak Joko',
                phone: '0217654321',
                email: 'sales@astra-otoparts.com',
                address: 'Jl. Raya Pegangsaan Dua, Jakarta Utara',
                paymentTerms: 'Net 30 days',
                deliveryTerms: 'FOB Jakarta',
                isActive: true,
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'CV Mitra Jaya Motor',
                contactPerson: 'Ibu Sari',
                phone: '0228765432',
                email: 'mitrajaya@email.com',
                address: 'Jl. Soekarno Hatta No. 234, Bandung',
                paymentTerms: 'COD',
                deliveryTerms: 'Free ongkir Jabodetabek',
                isActive: true,
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'PT Federal Karyatama',
                contactPerson: 'Pak Bambang',
                phone: '0319876543',
                email: 'federal@supplier.com',
                address: 'Kawasan Industri PIER, Pasuruan',
                paymentTerms: 'Net 14 days',
                deliveryTerms: 'FOB Surabaya',
                isActive: true,
            },
        }),
        prisma.supplier.create({
            data: {
                name: 'UD Sumber Rezeki',
                contactPerson: 'Pak Agus',
                phone: '0274123456',
                email: 'sumberrezeki@email.com',
                address: 'Jl. Magelang KM 5, Yogyakarta',
                paymentTerms: '50% DP, 50% saat barang sampai',
                deliveryTerms: 'CIF',
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Created ${suppliers.length} suppliers`);

    // ==========================================
    // CREATE CUSTOMERS
    // ==========================================
    console.log('👥 Creating customers...');

    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                name: 'Budi Setiawan',
                phone: '081234567801',
                email: 'budi.setiawan@email.com',
                address: 'Jl. Kebon Jeruk No. 12, Jakarta Barat',
                isActive: true,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Siti Nurhaliza',
                phone: '081234567802',
                address: 'Jl. Dipatiukur No. 45, Bandung',
                isActive: true,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Ahmad Fauzi',
                phone: '081234567803',
                email: 'ahmad.fauzi@email.com',
                address: 'Jl. Gubeng Kertajaya No. 88, Surabaya',
                isActive: true,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Rina Wati',
                phone: '081234567804',
                address: 'Jl. Cihampelas No. 156, Bandung',
                isActive: true,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Dedi Susanto',
                phone: '081234567805',
                email: 'dedi.motor@email.com',
                address: 'Jl. Thamrin No. 99, Jakarta Pusat',
                notes: 'Pelanggan setia, sering beli grosir',
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Created ${customers.length} customers`);

    // ==========================================
    // CREATE PURCHASE ORDERS
    // ==========================================
    console.log('📝 Creating purchase orders...');

    // PO 1 - Jakarta - RECEIVED
    const po1 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-20241001-0001',
            supplierId: suppliers[0].id,
            branchId: branchJakarta.id,
            orderDate: new Date('2024-10-01'),
            expectedDate: new Date('2024-10-05'),
            receivedDate: new Date('2024-10-05'),
            status: PurchaseOrderStatus.RECEIVED,
            subtotal: 5820000,
            taxAmount: 582000,
            discountAmount: 0,
            shippingCost: 100000,
            totalAmount: 6502000,
            paymentTerms: 'Net 30 days',
            createdBy: managers[0].id,
            approvedBy: admin.id,
            receivedBy: cashiers[0].id,
            notes: 'Stok awal cabang Jakarta',
        },
    });

    await prisma.purchaseOrderItem.createMany({
        data: [
            {
                purchaseOrderId: po1.id,
                productId: products[0].id, // Federal Matic
                orderedQty: 50,
                receivedQty: 50,
                unitPrice: 28000,
                subtotal: 1400000,
            },
            {
                purchaseOrderId: po1.id,
                productId: products[4].id, // NGK Iridium
                orderedQty: 30,
                receivedQty: 30,
                unitPrice: 75000,
                subtotal: 2250000,
            },
            {
                purchaseOrderId: po1.id,
                productId: products[7].id, // GS Astra
                orderedQty: 12,
                receivedQty: 12,
                unitPrice: 165000,
                subtotal: 1980000,
            },
            {
                purchaseOrderId: po1.id,
                productId: products[10].id, // Filter Aspira
                orderedQty: 6,
                receivedQty: 6,
                unitPrice: 32000,
                subtotal: 192000,
            },
        ],
    });

    // PO 2 - Bandung - RECEIVED
    const po2 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-20241002-0002',
            supplierId: suppliers[1].id,
            branchId: branchBandung.id,
            orderDate: new Date('2024-10-02'),
            expectedDate: new Date('2024-10-06'),
            receivedDate: new Date('2024-10-06'),
            status: PurchaseOrderStatus.RECEIVED,
            subtotal: 4235000,
            taxAmount: 423500,
            discountAmount: 50000,
            shippingCost: 75000,
            totalAmount: 4683500,
            paymentTerms: 'COD',
            createdBy: managers[1].id,
            approvedBy: admin.id,
            receivedBy: cashiers[1].id,
            notes: 'Stok awal cabang Bandung',
        },
    });

    await prisma.purchaseOrderItem.createMany({
        data: [
            {
                purchaseOrderId: po2.id,
                productId: products[1].id, // Castrol
                orderedQty: 30,
                receivedQty: 30,
                unitPrice: 65000,
                subtotal: 1950000,
            },
            {
                purchaseOrderId: po2.id,
                productId: products[5].id, // NGK Standard
                orderedQty: 40,
                receivedQty: 40,
                unitPrice: 12000,
                subtotal: 480000,
            },
            {
                purchaseOrderId: po2.id,
                productId: products[9].id, // Ban FDR
                orderedQty: 10,
                receivedQty: 10,
                unitPrice: 145000,
                subtotal: 1450000,
            },
            {
                purchaseOrderId: po2.id,
                productId: products[11].id, // Kampas Rem Nissin
                orderedQty: 7,
                receivedQty: 7,
                unitPrice: 55000,
                subtotal: 385000,
            },
        ],
    });

    // PO 3 - Jakarta - APPROVED (Pending delivery)
    const po3 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-20241010-0003',
            supplierId: suppliers[2].id,
            branchId: branchJakarta.id,
            orderDate: new Date('2024-10-10'),
            expectedDate: new Date('2024-10-15'),
            status: PurchaseOrderStatus.APPROVED,
            subtotal: 3150000,
            taxAmount: 315000,
            discountAmount: 0,
            shippingCost: 120000,
            totalAmount: 3585000,
            paymentTerms: 'Net 14 days',
            createdBy: managers[0].id,
            approvedBy: admin.id,
            notes: 'Restock oli Federal',
        },
    });

    await prisma.purchaseOrderItem.createMany({
        data: [
            {
                purchaseOrderId: po3.id,
                productId: products[0].id, // Federal Matic
                orderedQty: 100,
                receivedQty: 0,
                unitPrice: 28000,
                subtotal: 2800000,
            },
            {
                purchaseOrderId: po3.id,
                productId: products[3].id, // Oli Gardan
                orderedQty: 20,
                receivedQty: 0,
                unitPrice: 18000,
                subtotal: 360000,
            },
        ],
    });

    // PO 4 - Bandung - PENDING (Waiting approval)
    const po4 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-20241012-0004',
            supplierId: suppliers[3].id,
            branchId: branchBandung.id,
            orderDate: new Date('2024-10-12'),
            expectedDate: new Date('2024-10-18'),
            status: PurchaseOrderStatus.PENDING,
            subtotal: 2640000,
            taxAmount: 264000,
            discountAmount: 0,
            shippingCost: 90000,
            totalAmount: 2994000,
            paymentTerms: '50% DP',
            createdBy: managers[1].id,
            notes: 'Butuh persetujuan admin',
        },
    });

    await prisma.purchaseOrderItem.createMany({
        data: [
            {
                purchaseOrderId: po4.id,
                productId: products[8].id, // Yuasa Aki
                orderedQty: 8,
                receivedQty: 0,
                unitPrice: 210000,
                subtotal: 1680000,
            },
            {
                purchaseOrderId: po4.id,
                productId: products[6].id, // Denso Busi
                orderedQty: 15,
                receivedQty: 0,
                unitPrice: 68000,
                subtotal: 1020000,
            },
        ],
    });

    console.log(`✅ Created 4 purchase orders`);

    // ==========================================
    // CREATE STOCKS (from received POs)
    // ==========================================
    console.log('📦 Creating stocks...');

    // Jakarta stocks (from PO1)
    const jakartaStocks = await Promise.all([
        prisma.stock.create({
            data: {
                productId: products[0].id,
                branchId: branchJakarta.id,
                quantity: 50,
                lastRestockDate: new Date('2024-10-05'),
            },
        }),
        prisma.stock.create({
            data: {
                productId: products[4].id,
                branchId: branchJakarta.id,
                quantity: 30,
                lastRestockDate: new Date('2024-10-05'),
            },
        }),
        prisma.stock.create({
            data: {
                productId: products[7].id,
                branchId: branchJakarta.id,
                quantity: 12,
                lastRestockDate: new Date('2024-10-05'),
            },
        }),
        prisma.stock.create({
            data: {
                productId: products[10].id,
                branchId: branchJakarta.id,
                quantity: 6,
                lastRestockDate: new Date('2024-10-05'),
            },
        }),
    ]);

    // Bandung stocks (from PO2)
    const bandungStocks = await Promise.all([
        prisma.stock.create({
            data: {
                productId: products[1].id,
                branchId: branchBandung.id,
                quantity: 30,
                lastRestockDate: new Date('2024-10-06'),
            },
        }),
        prisma.stock.create({
            data: {
                productId: products[5].id,
                branchId: branchBandung.id,
                quantity: 40,
                lastRestockDate: new Date('2024-10-06'),
            },
        }),
        prisma.stock.create({
            data: {
                productId: products[9].id,
                branchId: branchBandung.id,
                quantity: 10,
                lastRestockDate: new Date('2024-10-06'),
            },
        }),
        prisma.stock.create({
            data: {
                productId: products[11].id,
                branchId: branchBandung.id,
                quantity: 7,
                lastRestockDate: new Date('2024-10-06'),
            },
        }),
    ]);

    // Add some stocks for other products (initial stock)
    await Promise.all([
        prisma.stock.create({
            data: {
                productId: products[2].id, // Shell
                branchId: branchJakarta.id,
                quantity: 25,
                lastRestockDate: new Date('2024-10-01'),
            },
        }),
        prisma.stock.create({
            data: {
                productId: products[2].id,
                branchId: branchBandung.id,
                quantity: 18,
                lastRestockDate: new Date('2024-10-01'),
            },
        }),
        prisma.stock.create({
            data: {
                productId: products[12].id, // Kampas Rem Aspira
                branchId: branchJakarta.id,
                quantity: 15,
                lastRestockDate: new Date('2024-10-01'),
            },
        }),
    ]);

    console.log(`✅ Created stocks for active branches`);

    // ==========================================
    // CREATE STOCK MOVEMENTS
    // ==========================================
    console.log('📊 Creating stock movements...');

    // Stock IN movements from PO1 (Jakarta)
    await Promise.all([
        prisma.stockMovement.create({
            data: {
                productId: products[0].id,
                branchId: branchJakarta.id,
                type: StockMovementType.IN,
                quantity: 50,
                previousStock: 0,
                newStock: 50,
                referenceType: 'PURCHASE_ORDER',
                referenceId: po1.id,
                notes: 'Penerimaan dari PO-20241001-0001',
                performedBy: cashiers[0].id,
                createdAt: new Date('2024-10-05T10:00:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[4].id,
                branchId: branchJakarta.id,
                type: StockMovementType.IN,
                quantity: 30,
                previousStock: 0,
                newStock: 30,
                referenceType: 'PURCHASE_ORDER',
                referenceId: po1.id,
                notes: 'Penerimaan dari PO-20241001-0001',
                performedBy: cashiers[0].id,
                createdAt: new Date('2024-10-05T10:15:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[7].id,
                branchId: branchJakarta.id,
                type: StockMovementType.IN,
                quantity: 12,
                previousStock: 0,
                newStock: 12,
                referenceType: 'PURCHASE_ORDER',
                referenceId: po1.id,
                notes: 'Penerimaan dari PO-20241001-0001',
                performedBy: cashiers[0].id,
                createdAt: new Date('2024-10-05T10:30:00'),
            },
        }),
    ]);

    // Stock IN movements from PO2 (Bandung)
    await Promise.all([
        prisma.stockMovement.create({
            data: {
                productId: products[1].id,
                branchId: branchBandung.id,
                type: StockMovementType.IN,
                quantity: 30,
                previousStock: 0,
                newStock: 30,
                referenceType: 'PURCHASE_ORDER',
                referenceId: po2.id,
                notes: 'Penerimaan dari PO-20241002-0002',
                performedBy: cashiers[1].id,
                createdAt: new Date('2024-10-06T09:00:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[5].id,
                branchId: branchBandung.id,
                type: StockMovementType.IN,
                quantity: 40,
                previousStock: 0,
                newStock: 40,
                referenceType: 'PURCHASE_ORDER',
                referenceId: po2.id,
                notes: 'Penerimaan dari PO-20241002-0002',
                performedBy: cashiers[1].id,
                createdAt: new Date('2024-10-06T09:15:00'),
            },
        }),
    ]);

    // Stock OUT movements (sales simulation)
    await Promise.all([
        prisma.stockMovement.create({
            data: {
                productId: products[0].id,
                branchId: branchJakarta.id,
                type: StockMovementType.OUT,
                quantity: 5,
                previousStock: 50,
                newStock: 45,
                referenceType: 'SALE',
                referenceId: 'SALE-001',
                notes: 'Penjualan retail',
                performedBy: cashiers[0].id,
                createdAt: new Date('2024-10-07T14:30:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[4].id,
                branchId: branchJakarta.id,
                type: StockMovementType.OUT,
                quantity: 2,
                previousStock: 30,
                newStock: 28,
                referenceType: 'SALE',
                referenceId: 'SALE-002',
                notes: 'Penjualan retail',
                performedBy: cashiers[0].id,
                createdAt: new Date('2024-10-08T11:20:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[1].id,
                branchId: branchBandung.id,
                type: StockMovementType.OUT,
                quantity: 3,
                previousStock: 30,
                newStock: 27,
                referenceType: 'SALE',
                referenceId: 'SALE-003',
                notes: 'Penjualan grosir',
                performedBy: cashiers[1].id,
                createdAt: new Date('2024-10-09T15:45:00'),
            },
        }),
    ]);

    // Update stocks after sales
    await Promise.all([
        prisma.stock.update({
            where: { id: jakartaStocks[0].id },
            data: { quantity: 45, lastSaleDate: new Date('2024-10-07') },
        }),
        prisma.stock.update({
            where: { id: jakartaStocks[1].id },
            data: { quantity: 28, lastSaleDate: new Date('2024-10-08') },
        }),
        prisma.stock.update({
            where: { id: bandungStocks[0].id },
            data: { quantity: 27, lastSaleDate: new Date('2024-10-09') },
        }),
    ]);

    // Stock ADJUSTMENT movement
    await prisma.stockMovement.create({
        data: {
            productId: products[5].id,
            branchId: branchBandung.id,
            type: StockMovementType.ADJUSTMENT,
            quantity: -2,
            previousStock: 40,
            newStock: 38,
            reason: 'Stock opname - barang rusak',
            notes: 'Ditemukan 2 busi rusak saat stock opname',
            performedBy: managers[1].id,
            createdAt: new Date('2024-10-10T08:00:00'),
        },
    });

    await prisma.stock.update({
        where: { id: bandungStocks[1].id },
        data: { quantity: 38 },
    });

    // Stock TRANSFER movement (Jakarta -> Bandung)
    const transferProduct = products[7]; // GS Astra Aki
    await Promise.all([
        // OUT from Jakarta
        prisma.stockMovement.create({
            data: {
                productId: transferProduct.id,
                branchId: branchJakarta.id,
                type: StockMovementType.TRANSFER,
                quantity: -3,
                previousStock: 12,
                newStock: 9,
                fromBranchId: branchJakarta.id,
                toBranchId: branchBandung.id,
                referenceType: 'TRANSFER',
                referenceId: 'TRF-001',
                notes: 'Transfer ke Bandung - request manager',
                performedBy: managers[0].id,
                createdAt: new Date('2024-10-11T13:00:00'),
            },
        }),
        // IN to Bandung
        prisma.stockMovement.create({
            data: {
                productId: transferProduct.id,
                branchId: branchBandung.id,
                type: StockMovementType.TRANSFER,
                quantity: 3,
                previousStock: 0,
                newStock: 3,
                fromBranchId: branchJakarta.id,
                toBranchId: branchBandung.id,
                referenceType: 'TRANSFER',
                referenceId: 'TRF-001',
                notes: 'Terima transfer dari Jakarta',
                performedBy: managers[1].id,
                createdAt: new Date('2024-10-11T16:00:00'),
            },
        }),
    ]);

    // Update stocks after transfer
    await Promise.all([
        prisma.stock.update({
            where: { id: jakartaStocks[2].id },
            data: { quantity: 9 },
        }),
        prisma.stock.create({
            data: {
                productId: transferProduct.id,
                branchId: branchBandung.id,
                quantity: 3,
                lastRestockDate: new Date('2024-10-11'),
            },
        }),
    ]);

    console.log(`✅ Created stock movements`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n📊 Seeding Summary:');
    console.log('='.repeat(70));
    console.log(`👤 Users: ${1 + managers.length + cashiers.length}`);
    console.log(`   - Admin: 1`);
    console.log(`   - Managers: ${managers.length}`);
    console.log(`   - Cashiers: ${cashiers.length}`);
    console.log(`\n🏢 Branches: 3`);
    console.log(`   - ACTIVE: 2 (Jakarta, Bandung)`);
    console.log(`   - PENDING: 1 (Surabaya)`);
    console.log(`\n📦 Categories: ${9} (4 parent, 5 child)`);
    console.log(`🏷️  Brands: ${brands.length}`);
    console.log(`🛍️  Products: ${products.length}`);
    console.log(`🏭 Suppliers: ${suppliers.length}`);
    console.log(`👥 Customers: ${customers.length}`);
    console.log(`📝 Purchase Orders: 4`);
    console.log(`   - RECEIVED: 2`);
    console.log(`   - APPROVED: 1`);
    console.log(`   - PENDING: 1`);
    console.log(`📦 Stock Records: Multiple per branch`);
    console.log(`📊 Stock Movements: Multiple (IN, OUT, TRANSFER, ADJUSTMENT)`);

    console.log('\n🔑 Login Credentials:');
    console.log('='.repeat(70));
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

    console.log('\n📦 Sample Stock Data:');
    console.log('='.repeat(70));
    console.log('Jakarta Branch:');
    console.log('  - Federal Matic: 45 pcs (sold 5)');
    console.log('  - NGK Iridium: 28 pcs (sold 2)');
    console.log('  - GS Astra Aki: 9 pcs (transfer 3 ke Bandung)');
    console.log('  - Filter Aspira: 6 pcs');
    console.log('\nBandung Branch:');
    console.log('  - Castrol Power1: 27 pcs (sold 3)');
    console.log('  - NGK Standard: 38 pcs (adjustment -2)');
    console.log('  - Ban FDR: 10 pcs');
    console.log('  - Kampas Rem Nissin: 7 pcs');
    console.log('  - GS Astra Aki: 3 pcs (from Jakarta)');

    console.log('='.repeat(70));
    console.log('\n✅ Complete seeding finished successfully!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
