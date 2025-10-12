import prisma from '@/config/database';

export class TokenRepository {
    async create(data: { token: string; userId: string; expiresAt: Date }) {
        return prisma.refreshToken.create({
            data,
        });
    }

    async findByToken(token: string) {
        return prisma.refreshToken.findUnique({
            where: { token },
        });
    }

    async deleteByToken(token: string) {
        return prisma.refreshToken.delete({
            where: { token },
        });
    }

    async deleteByUserId(userId: string) {
        return prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }

    async deleteExpired() {
        return prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }
}
