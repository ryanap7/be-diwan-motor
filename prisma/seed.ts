import {
    PrismaClient,
    UserRole,
    BranchStatus,
    StockMovementType,
    PurchaseOrderStatus,
    PaymentMethod,
    TransactionStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

async function main() {
    console.log('🌱 Starting additional seed (INCREMENT ONLY)...\n');

    // ==========================================
    // GET EXISTING DATA
    // ==========================================
    console.log('📥 Fetching existing data...');

    const admin = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
    });

    const branches = await prisma.branch.findMany({
        where: { isActive: true },
    });

    const products = await prisma.product.findMany({
        take: 20,
    });

    const suppliers = await prisma.supplier.findMany({
        take: 10,
    });

    await prisma.customer.findMany({
        take: 10,
    });

    const managers = await prisma.user.findMany({
        where: { role: UserRole.BRANCH_MANAGER },
    });

    const cashiers = await prisma.user.findMany({
        where: { role: UserRole.CASHIER },
    });

    if (!admin || branches.length === 0 || products.length === 0) {
        console.error(
            '❌ Data utama tidak ditemukan. Jalankan seed utama terlebih dahulu!'
        );
        process.exit(1);
    }

    console.log('✅ Existing data loaded successfully\n');

    // ==========================================
    // ADD NEW USERS
    // ==========================================
    console.log('👤 Adding new users...');

    const newCashiers = await Promise.all([
        prisma.user.create({
            data: {
                username: 'cashier_jakarta2',
                password: await hashPassword('Cashier123!'),
                email: 'cashier.jakarta2@company.com',
                fullName: 'Hendra Gunawan',
                phone: '081234567907',
                role: UserRole.CASHIER,
                isActive: true,
                branchId: branches[0].id,
            },
        }),
        prisma.user.create({
            data: {
                username: 'cashier_bandung2',
                password: await hashPassword('Cashier123!'),
                email: 'cashier.bandung2@company.com',
                fullName: 'Lina Wijaya',
                phone: '081234567908',
                role: UserRole.CASHIER,
                isActive: true,
                branchId: branches[1].id,
            },
        }),
    ]);

    console.log(`✅ Added ${newCashiers.length} new cashiers\n`);

    // ==========================================
    // ADD NEW CUSTOMERS
    // ==========================================
    console.log('👥 Adding new customers...');

    const newCustomers = await Promise.all([
        prisma.customer.create({
            data: {
                name: 'PT Wahyu Motors',
                phone: '081234567806',
                email: 'info@wahyumotors.com',
                address: 'Jl. Ahmad Yani No. 200, Jakarta Selatan',
                notes: 'Pelanggan korporat, pembelian rutin',
                isActive: true,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Toko Motor Sentosa',
                phone: '081234567807',
                email: 'sentosa.motor@email.com',
                address: 'Jl. Braga No. 78, Bandung',
                isActive: true,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Bengkel Jaya Raya',
                phone: '081234567808',
                address: 'Jl. Basuki Rahmat No. 45, Surabaya',
                notes: 'Bengkel besar, banyak order aksesori',
                isActive: true,
            },
        }),
        prisma.customer.create({
            data: {
                name: 'Eka Pratama',
                phone: '081234567809',
                email: 'eka.pratama@email.com',
                address: 'Jl. Merpati No. 12, Bandung',
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Added ${newCustomers.length} new customers\n`);

    // ==========================================
    // ADD NEW PURCHASE ORDERS
    // ==========================================
    console.log('📝 Adding new purchase orders...');

    // PO 5 - Jakarta - DRAFT
    const po5 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-20241015-0005',
            supplierId: suppliers[0].id,
            branchId: branches[0].id,
            orderDate: new Date('2024-10-15'),
            expectedDate: new Date('2024-10-20'),
            status: PurchaseOrderStatus.DRAFT,
            subtotal: 1950000,
            taxAmount: 195000,
            discountAmount: 0,
            shippingCost: 80000,
            totalAmount: 2225000,
            paymentTerms: 'Net 30 days',
            createdBy: managers[0].id,
            notes: 'Draft order untuk restock produk pilihan',
        },
    });

    await prisma.purchaseOrderItem.createMany({
        data: [
            {
                purchaseOrderId: po5.id,
                productId: products[1].id, // Castrol
                orderedQty: 20,
                receivedQty: 0,
                unitPrice: 65000,
                subtotal: 1300000,
            },
            {
                purchaseOrderId: po5.id,
                productId: products[6].id, // Denso Busi
                orderedQty: 10,
                receivedQty: 0,
                unitPrice: 68000,
                subtotal: 680000,
            },
        ],
    });

    // PO 6 - Bandung - PARTIALLY_RECEIVED
    const po6 = await prisma.purchaseOrder.create({
        data: {
            poNumber: 'PO-20241013-0006',
            supplierId: suppliers[1].id,
            branchId: branches[1].id,
            orderDate: new Date('2024-10-13'),
            expectedDate: new Date('2024-10-17'),
            receivedDate: new Date('2024-10-17'),
            status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
            subtotal: 3600000,
            taxAmount: 360000,
            discountAmount: 100000,
            shippingCost: 75000,
            totalAmount: 3935000,
            paymentTerms: 'COD',
            createdBy: managers[1].id,
            approvedBy: admin.id,
            receivedBy: cashiers[1].id,
            notes: 'Penerimaan partial - masih menunggu sisa barang',
        },
    });

    await prisma.purchaseOrderItem.createMany({
        data: [
            {
                purchaseOrderId: po6.id,
                productId: products[0].id, // Federal Matic
                orderedQty: 60,
                receivedQty: 40,
                unitPrice: 28000,
                subtotal: 1680000,
            },
            {
                purchaseOrderId: po6.id,
                productId: products[8].id, // Yuasa Aki
                orderedQty: 15,
                receivedQty: 15,
                unitPrice: 210000,
                subtotal: 3150000,
            },
            {
                purchaseOrderId: po6.id,
                productId: products[11].id, // Kampas Rem Nissin
                orderedQty: 8,
                receivedQty: 8,
                unitPrice: 55000,
                subtotal: 440000,
            },
        ],
    });

    // Update stocks from PO6 partial receipt
    const stock1 = await prisma.stock.findFirst({
        where: { productId: products[0].id, branchId: branches[1].id },
    });

    if (stock1) {
        await prisma.stock.update({
            where: { id: stock1.id },
            data: { quantity: (stock1.quantity || 0) + 40 },
        });
    } else {
        await prisma.stock.create({
            data: {
                productId: products[0].id,
                branchId: branches[1].id,
                quantity: 40,
                lastRestockDate: new Date('2024-10-17'),
            },
        });
    }

    // Record stock movements from PO6
    await Promise.all([
        prisma.stockMovement.create({
            data: {
                productId: products[0].id,
                branchId: branches[1].id,
                type: StockMovementType.IN,
                quantity: 40,
                previousStock: 0,
                newStock: 40,
                referenceType: 'PURCHASE_ORDER',
                referenceId: po6.id,
                notes: 'Penerimaan partial dari PO-20241013-0006',
                performedBy: cashiers[1].id,
                createdAt: new Date('2024-10-17T10:00:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[8].id,
                branchId: branches[1].id,
                type: StockMovementType.IN,
                quantity: 15,
                previousStock: 0,
                newStock: 15,
                referenceType: 'PURCHASE_ORDER',
                referenceId: po6.id,
                notes: 'Penerimaan partial dari PO-20241013-0006',
                performedBy: cashiers[1].id,
                createdAt: new Date('2024-10-17T10:15:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[11].id,
                branchId: branches[1].id,
                type: StockMovementType.IN,
                quantity: 8,
                previousStock: 7,
                newStock: 15,
                referenceType: 'PURCHASE_ORDER',
                referenceId: po6.id,
                notes: 'Penerimaan dari PO-20241013-0006',
                performedBy: cashiers[1].id,
                createdAt: new Date('2024-10-17T10:30:00'),
            },
        }),
    ]);

    await prisma.stock.updateMany({
        where: { productId: products[11].id, branchId: branches[1].id },
        data: { quantity: 15 },
    });

    console.log(`✅ Added 2 new purchase orders\n`);

    // ==========================================
    // ADD NEW TRANSACTIONS
    // ==========================================
    console.log('💳 Adding new transactions...');

    // Transaction 1 - Jakarta
    const transaction1 = await prisma.transaction.create({
        data: {
            invoiceNumber: 'INV-20241015-001',
            branchId: branches[0].id,
            cashierId: cashiers[0].id,
            customerId: newCustomers[0].id,
            subtotal: 385000,
            taxAmount: 38500,
            discountAmount: 0,
            totalAmount: 423500,
            paymentMethod: PaymentMethod.TRANSFER,
            amountPaid: 425000,
            changeAmount: 1500,
            status: TransactionStatus.COMPLETED,
            notes: 'Penjualan untuk PT Wahyu Motors',
            transactionDate: new Date('2024-10-15T09:30:00'),
        },
    });

    await prisma.transactionItem.createMany({
        data: [
            {
                transactionId: transaction1.id,
                productId: products[0].id,
                productName: 'Federal Matic 10W-40',
                productSku: 'OLI-FED-001',
                quantity: 3,
                unitPrice: 35000,
                subtotal: 105000,
            },
            {
                transactionId: transaction1.id,
                productId: products[4].id,
                productName: 'NGK Iridium CPR8EA-9',
                productSku: 'BSI-NGK-001',
                quantity: 8,
                unitPrice: 95000,
                subtotal: 760000,
            },
        ],
    });

    // Update stocks after transaction 1
    await Promise.all([
        prisma.stockMovement.create({
            data: {
                productId: products[0].id,
                branchId: branches[0].id,
                type: StockMovementType.OUT,
                quantity: 3,
                previousStock: 45,
                newStock: 42,
                referenceType: 'TRANSACTION',
                referenceId: transaction1.id,
                notes: 'Penjualan INV-20241015-001',
                performedBy: cashiers[0].id,
                createdAt: new Date('2024-10-15T09:30:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[4].id,
                branchId: branches[0].id,
                type: StockMovementType.OUT,
                quantity: 8,
                previousStock: 28,
                newStock: 20,
                referenceType: 'TRANSACTION',
                referenceId: transaction1.id,
                notes: 'Penjualan INV-20241015-001',
                performedBy: cashiers[0].id,
                createdAt: new Date('2024-10-15T09:30:00'),
            },
        }),
    ]);

    // Transaction 2 - Bandung
    const transaction2 = await prisma.transaction.create({
        data: {
            invoiceNumber: 'INV-20241015-002',
            branchId: branches[1].id,
            cashierId: cashiers[1].id,
            customerId: newCustomers[1].id,
            subtotal: 925000,
            taxAmount: 92500,
            discountAmount: 50000,
            totalAmount: 967500,
            paymentMethod: PaymentMethod.CASH,
            amountPaid: 1000000,
            changeAmount: 32500,
            status: TransactionStatus.COMPLETED,
            notes: 'Penjualan ke Toko Motor Sentosa',
            transactionDate: new Date('2024-10-16T14:45:00'),
        },
    });

    await prisma.transactionItem.createMany({
        data: [
            {
                transactionId: transaction2.id,
                productId: products[1].id,
                productName: 'Castrol Power1 4T 10W-40',
                productSku: 'OLI-CAS-001',
                quantity: 5,
                unitPrice: 85000,
                subtotal: 425000,
            },
            {
                transactionId: transaction2.id,
                productId: products[9].id,
                productName: 'Ban FDR Sport XR Evo 80/90-14',
                productSku: 'BAN-FDR-001',
                quantity: 4,
                unitPrice: 185000,
                subtotal: 740000,
            },
        ],
    });

    // Update stocks after transaction 2
    await Promise.all([
        prisma.stockMovement.create({
            data: {
                productId: products[1].id,
                branchId: branches[1].id,
                type: StockMovementType.OUT,
                quantity: 5,
                previousStock: 27,
                newStock: 22,
                referenceType: 'TRANSACTION',
                referenceId: transaction2.id,
                notes: 'Penjualan INV-20241015-002',
                performedBy: cashiers[1].id,
                createdAt: new Date('2024-10-16T14:45:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[9].id,
                branchId: branches[1].id,
                type: StockMovementType.OUT,
                quantity: 4,
                previousStock: 10,
                newStock: 6,
                referenceType: 'TRANSACTION',
                referenceId: transaction2.id,
                notes: 'Penjualan INV-20241015-002',
                performedBy: cashiers[1].id,
                createdAt: new Date('2024-10-16T14:45:00'),
            },
        }),
    ]);

    console.log(`✅ Added 2 new transactions\n`);

    // ==========================================
    // ADD MORE STOCK ADJUSTMENTS
    // ==========================================
    console.log('📊 Adding stock adjustments...');

    // Stock adjustment - stock opname
    await Promise.all([
        prisma.stockMovement.create({
            data: {
                productId: products[2].id,
                branchId: branches[0].id,
                type: StockMovementType.ADJUSTMENT,
                quantity: -1,
                previousStock: 25,
                newStock: 24,
                reason: 'Stock opname - barang expired',
                notes: 'Oli Shell Advance expired, dibuang',
                performedBy: managers[0].id,
                createdAt: new Date('2024-10-16T08:00:00'),
            },
        }),
        prisma.stock.updateMany({
            where: { productId: products[2].id, branchId: branches[0].id },
            data: { quantity: 24 },
        }),
    ]);

    // Additional stock transfers
    await Promise.all([
        prisma.stockMovement.create({
            data: {
                productId: products[5].id,
                branchId: branches[1].id,
                type: StockMovementType.TRANSFER,
                quantity: -5,
                previousStock: 38,
                newStock: 33,
                fromBranchId: branches[1].id,
                toBranchId: branches[0].id,
                referenceType: 'TRANSFER',
                referenceId: 'TRF-002',
                notes: 'Transfer NGK Standard ke Jakarta',
                performedBy: managers[1].id,
                createdAt: new Date('2024-10-17T10:00:00'),
            },
        }),
        prisma.stockMovement.create({
            data: {
                productId: products[5].id,
                branchId: branches[0].id,
                type: StockMovementType.TRANSFER,
                quantity: 5,
                previousStock: 20,
                newStock: 25,
                fromBranchId: branches[1].id,
                toBranchId: branches[0].id,
                referenceType: 'TRANSFER',
                referenceId: 'TRF-002',
                notes: 'Terima transfer NGK Standard dari Bandung',
                performedBy: managers[0].id,
                createdAt: new Date('2024-10-17T11:00:00'),
            },
        }),
    ]);

    console.log(`✅ Added stock adjustments\n`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('='.repeat(70));
    console.log('📊 ADDITIONAL SEEDING SUMMARY:');
    console.log('='.repeat(70));
    console.log(`\n👤 New Users Added: ${newCashiers.length}`);
    console.log(`   - Cashiers: ${newCashiers.length}`);

    console.log(`\n👥 New Customers Added: ${newCustomers.length}`);
    newCustomers.forEach((c) => console.log(`   - ${c.name}`));

    console.log(`\n📝 New Purchase Orders Added: 2`);
    console.log(`   - PO-20241015-0005 (DRAFT) - Jakarta`);
    console.log(`   - PO-20241013-0006 (PARTIALLY_RECEIVED) - Bandung`);

    console.log(`\n💳 New Transactions Added: 2`);
    console.log(`   - INV-20241015-001 - PT Wahyu Motors`);
    console.log(`   - INV-20241015-002 - Toko Motor Sentosa`);

    console.log(`\n📦 Stock Movements Added: Multiple`);
    console.log(`   - Stock IN dari PO6`);
    console.log(`   - Stock OUT dari transaksi`);
    console.log(`   - Stock ADJUSTMENT`);
    console.log(`   - Stock TRANSFER antar cabang`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ Additional seeding completed successfully!\n');
}

main()
    .catch((e) => {
        console.error('❌ Additional seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
