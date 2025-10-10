import { PrismaClient } from '@prisma/client';
import { config } from './env';

const prismaClientSingleton = () => {
    return new PrismaClient({
        log:
            config.app.env === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
        errorFormat: 'minimal',
    });
};

declare global {
    // eslint-disable-next-line no-var
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (config.app.env !== 'production') {
    globalThis.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

export default prisma;
