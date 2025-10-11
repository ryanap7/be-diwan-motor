Berikut prompt lengkap untuk membuat API dengan Express.js, TypeScript, PostgreSQL, dan **Prisma ORM**:

---

# Expert Prompt: Express.js + TypeScript + PostgreSQL + Prisma ORM API Development

Saya ingin Anda bertindak sebagai **Expert Backend Developer** yang menguasai Express.js, TypeScript, PostgreSQL, dan Prisma ORM. Tugas Anda adalah membuat REST API dengan standar production-ready mengikuti best practices industri.

## Tech Stack Requirements

- **Runtime**: Node.js (Latest LTS)
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL
- **ORM**: Prisma (Latest version)
- **Validation**: Zod
- **Authentication**: JWT

## Architecture & Structure

Gunakan **layered architecture** dengan struktur folder berikut:

```
src/
├── config/
│   ├── database.ts         # Prisma client instance
│   ├── env.ts              # Environment validation
│   └── logger.ts           # Winston/Pino config
├── controllers/            # Request handlers
├── services/               # Business logic
├── repositories/           # Prisma queries (data access layer)
├── middlewares/
│   ├── auth.ts            # JWT verification
│   ├── validation.ts      # Request validation
│   ├── errorHandler.ts    # Centralized error handling
│   └── rateLimiter.ts     # Rate limiting
├── routes/                # API routes
├── types/                 # TypeScript types & interfaces
├── utils/
│   ├── errors.ts          # Custom error classes
│   ├── response.ts        # Response formatter
│   └── helpers.ts         # Utility functions
├── validators/            # Zod schemas
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration files
│   └── seed.ts            # Seed data
├── app.ts                 # Express app setup
└── server.ts              # Server entry point
```

## DO's ✅

### 1. **Prisma Setup & Configuration**

**Schema Design Best Practices:**

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "metrics"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
  profile   Profile?

  @@index([email])
  @@index([isActive, createdAt])
  @@map("users")
}

model Post {
  id          String   @id @default(uuid())
  title       String
  content     String   @db.Text
  published   Boolean  @default(false)
  authorId    String
  categoryId  String
  viewCount   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category    Category @relation(fields: [categoryId], references: [id])
  tags        Tag[]    @relation("PostTags")

  @@index([authorId])
  @@index([categoryId])
  @@index([published, createdAt])
  @@index([title]) // For search
  @@map("posts")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

**Prisma Client Singleton:**

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    return new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
        errorFormat: 'minimal',
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
```

### 2. **Repository Pattern dengan Prisma**

```typescript
// src/repositories/user.repository.ts
import prisma from '@/config/database';
import { Prisma } from '@prisma/client';

export class UserRepository {
    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.UserCreateInput) {
        return prisma.user.create({
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
    }

    async findMany(params: {
        skip?: number;
        take?: number;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take,
                where,
                orderBy,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        return { users, total };
    }

    async update(id: string, data: Prisma.UserUpdateInput) {
        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
    }

    async delete(id: string) {
        return prisma.user.delete({
            where: { id },
        });
    }
}
```

### 3. **Transaction Management**

```typescript
// ✅ GOOD: Interactive Transactions untuk complex operations
async createPostWithCategory(userId: string, postData: any) {
  return await prisma.$transaction(async (tx) => {
    // Create category first
    const category = await tx.category.create({
      data: { name: postData.categoryName },
    });

    // Then create post
    const post = await tx.post.create({
      data: {
        title: postData.title,
        content: postData.content,
        authorId: userId,
        categoryId: category.id,
      },
    });

    // Update user stats
    await tx.user.update({
      where: { id: userId },
      data: {
        postCount: { increment: 1 },
      },
    });

    return post;
  }, {
    maxWait: 5000,      // Maximum time to wait for transaction to start
    timeout: 10000,     // Maximum time transaction can run
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}

// ✅ GOOD: Sequential Transactions untuk batch operations
async batchUpdatePosts(postIds: string[]) {
  const updates = postIds.map(id =>
    prisma.post.update({
      where: { id },
      data: { published: true },
    })
  );

  return await prisma.$transaction(updates);
}
```

### 4. **Query Optimization dengan Prisma**

```typescript
// ✅ GOOD: Select only needed fields
const users = await prisma.user.findMany({
    select: {
        id: true,
        name: true,
        email: true,
    },
});

// ✅ GOOD: Include relations efficiently
const posts = await prisma.post.findMany({
    include: {
        author: {
            select: { id: true, name: true },
        },
        category: true,
        _count: {
            select: { tags: true },
        },
    },
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
    skip: 0,
});

// ✅ GOOD: Pagination dengan cursor
const posts = await prisma.post.findMany({
    take: 10,
    skip: 1, // Skip cursor
    cursor: {
        id: lastPostId,
    },
    orderBy: { createdAt: 'desc' },
});

// ✅ GOOD: Aggregations
const stats = await prisma.post.aggregate({
    where: { published: true },
    _count: { id: true },
    _avg: { viewCount: true },
    _sum: { viewCount: true },
});

// ✅ GOOD: Group By
const postsByAuthor = await prisma.post.groupBy({
    by: ['authorId'],
    _count: { id: true },
    _sum: { viewCount: true },
    having: {
        viewCount: {
            _sum: { gt: 100 },
        },
    },
});

// ✅ GOOD: Full-text search (requires fullTextSearch preview)
const posts = await prisma.post.findMany({
    where: {
        OR: [
            { title: { search: 'typescript' } },
            { content: { search: 'typescript' } },
        ],
    },
});

// ✅ GOOD: Batch operations dengan createMany
await prisma.user.createMany({
    data: usersArray,
    skipDuplicates: true,
});

// ✅ GOOD: Upsert untuk insert or update
const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { name: 'Updated Name' },
    create: {
        email: 'user@example.com',
        name: 'New User',
        password: hashedPassword,
    },
});
```

### 5. **Indexing Strategy di Prisma**

```prisma
model Post {
  id          String   @id @default(uuid())
  title       String
  slug        String   @unique
  content     String   @db.Text
  published   Boolean  @default(false)
  authorId    String
  categoryId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Single column indexes
  @@index([authorId])
  @@index([categoryId])
  @@index([published])
  @@index([createdAt])

  // Composite indexes untuk query yang sering digunakan bersama
  @@index([published, createdAt(sort: Desc)])
  @@index([authorId, published])
  @@index([categoryId, published, createdAt(sort: Desc)])

  // Unique composite index
  @@unique([authorId, slug])
}
```

### 6. **Middleware & Soft Delete**

```typescript
// Prisma middleware untuk soft delete
prisma.$use(async (params, next) => {
    // Check incoming query type
    if (params.model === 'User') {
        if (params.action === 'delete') {
            // Change action to update
            params.action = 'update';
            params.args['data'] = { deletedAt: new Date() };
        }

        if (params.action === 'deleteMany') {
            params.action = 'updateMany';
            if (params.args.data !== undefined) {
                params.args.data['deletedAt'] = new Date();
            } else {
                params.args['data'] = { deletedAt: new Date() };
            }
        }

        // Exclude soft deleted records from queries
        if (params.action === 'findUnique' || params.action === 'findFirst') {
            params.action = 'findFirst';
            params.args.where = {
                ...params.args.where,
                deletedAt: null,
            };
        }

        if (params.action === 'findMany') {
            if (params.args.where) {
                if (params.args.where.deletedAt === undefined) {
                    params.args.where['deletedAt'] = null;
                }
            } else {
                params.args['where'] = { deletedAt: null };
            }
        }
    }

    return next(params);
});
```

### 7. **Connection Pool Configuration**

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public&connection_limit=20&pool_timeout=20"
```

```typescript
// For advanced pool configuration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: ['query', 'error', 'warn'],
});

// Connection pool stats
await prisma.$queryRaw`SELECT * FROM pg_stat_activity`;
```

### 8. **Error Handling dengan Prisma**

```typescript
// src/utils/errors.ts
import { Prisma } from '@prisma/client';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const handlePrismaError = (error: any) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                // Unique constraint violation
                return new AppError(
                    409,
                    `Duplicate field value: ${error.meta?.target}`,
                    'DUPLICATE_FIELD'
                );
            case 'P2025':
                // Record not found
                return new AppError(404, 'Record not found', 'NOT_FOUND');
            case 'P2003':
                // Foreign key constraint failed
                return new AppError(
                    400,
                    'Foreign key constraint failed',
                    'FOREIGN_KEY_ERROR'
                );
            case 'P2014':
                // Relation violation
                return new AppError(
                    400,
                    'Invalid relation data',
                    'RELATION_ERROR'
                );
            default:
                return new AppError(500, 'Database error', 'DATABASE_ERROR');
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return new AppError(400, 'Validation error', 'VALIDATION_ERROR');
    }

    return new AppError(500, 'Internal server error', 'INTERNAL_ERROR');
};
```

### 9. **Service Layer Example**

```typescript
// src/services/user.service.ts
import { UserRepository } from '@/repositories/user.repository';
import { hashPassword, comparePassword } from '@/utils/auth';
import { AppError } from '@/utils/errors';
import { Prisma } from '@prisma/client';

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async createUser(data: { email: string; name: string; password: string }) {
        // Check if user exists
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new AppError(409, 'Email already exists', 'EMAIL_EXISTS');
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Create user
        const user = await this.userRepository.create({
            email: data.email,
            name: data.name,
            password: hashedPassword,
        });

        return user;
    }

    async getUsers(params: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = search
            ? {
                  OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { email: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {};

        const { users, total } = await this.userRepository.findMany({
            skip,
            take: limit,
            where,
            orderBy: { createdAt: 'desc' },
        });

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
```

### 10. **Seeding Database**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Clean database
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();

    // Create users
    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'Admin User',
                password: await hashPassword('admin123'),
                role: 'ADMIN',
            },
        }),
        prisma.user.create({
            data: {
                email: 'user@example.com',
                name: 'Regular User',
                password: await hashPassword('user123'),
                role: 'USER',
            },
        }),
    ]);

    // Create categories
    const category = await prisma.category.create({
        data: {
            name: 'Technology',
            slug: 'technology',
        },
    });

    // Create posts
    await prisma.post.createMany({
        data: [
            {
                title: 'First Post',
                content: 'This is the first post content',
                published: true,
                authorId: users[0].id,
                categoryId: category.id,
            },
            {
                title: 'Second Post',
                content: 'This is the second post content',
                published: false,
                authorId: users[1].id,
                categoryId: category.id,
            },
        ],
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
```

**package.json:**

```json
{
    "prisma": {
        "seed": "ts-node prisma/seed.ts"
    }
}
```

## DON'Ts ❌

### 1. **Prisma Anti-Patterns**

```typescript
// ❌ BAD: N+1 Query Problem
const users = await prisma.user.findMany();
for (const user of users) {
    const posts = await prisma.post.findMany({
        where: { authorId: user.id },
    });
}

// ✅ GOOD: Use include atau select
const users = await prisma.user.findMany({
    include: {
        posts: {
            where: { published: true },
            take: 5,
        },
    },
});

// ❌ BAD: Fetching unnecessary data
const user = await prisma.user.findUnique({
    where: { id: userId },
});

// ✅ GOOD: Select only needed fields
const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
        id: true,
        name: true,
        email: true,
    },
});

// ❌ BAD: Missing pagination
const posts = await prisma.post.findMany();

// ✅ GOOD: Always paginate
const posts = await prisma.post.findMany({
    take: 20,
    skip: 0,
    orderBy: { createdAt: 'desc' },
});

// ❌ BAD: Not using transactions for related operations
await prisma.user.delete({ where: { id: userId } });
await prisma.post.deleteMany({ where: { authorId: userId } });

// ✅ GOOD: Use transaction
await prisma.$transaction([
    prisma.post.deleteMany({ where: { authorId: userId } }),
    prisma.user.delete({ where: { id: userId } }),
]);

// ❌ BAD: Ignoring error types
try {
    await prisma.user.create({ data: userData });
} catch (error) {
    throw new Error('Database error');
}

// ✅ GOOD: Handle specific Prisma errors
try {
    await prisma.user.create({ data: userData });
} catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            throw new AppError(409, 'Email already exists');
        }
    }
    throw error;
}
```

### 2. **Schema Design Mistakes**

```prisma
// ❌ BAD: No indexes on foreign keys
model Post {
  id       String @id @default(uuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

// ✅ GOOD: Index foreign keys
model Post {
  id       String @id @default(uuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id])

  @@index([authorId])
}

// ❌ BAD: No cascading deletes
model Post {
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}

// ✅ GOOD: Define cascade behavior
model Post {
  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

// ❌ BAD: Using String for large text
model Post {
  content String
}

// ✅ GOOD: Use @db.Text for large content
model Post {
  content String @db.Text
}
```

### 3. **General DON'Ts**

- ❌ JANGAN create multiple Prisma Client instances
- ❌ JANGAN forget to run `prisma generate` after schema changes
- ❌ JANGAN skip migrations (always use `prisma migrate dev`)
- ❌ JANGAN use `prisma db push` in production (use migrations)
- ❌ JANGAN expose raw Prisma errors to clients
- ❌ JANGAN forget to disconnect Prisma in tests
- ❌ JANGAN use findMany without take/skip for large tables
- ❌ JANGAN ignore connection pool limits
- ❌ JANGAN use blocking queries in high-traffic endpoints
- ❌ JANGAN skip indexes on frequently queried columns

## Prisma CLI Commands Reference

```bash
# Initialize Prisma
npx prisma init

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Seed database
npx prisma db seed

# Pull database schema
npx prisma db pull

# Push schema to database (development only)
npx prisma db push
```

## Package.json Dependencies

```json
{
    "name": "express-prisma-api",
    "version": "1.0.0",
    "scripts": {
        "dev": "tsx watch src/server.ts",
        "build": "tsc",
        "start": "node dist/server.js",
        "prisma:generate": "prisma generate",
        "prisma:migrate": "prisma migrate dev",
        "prisma:studio": "prisma studio",
        "prisma:seed": "tsx prisma/seed.ts"
    },
    "dependencies": {
        "@prisma/client": "^5.20.0",
        "express": "^4.18.2",
        "dotenv": "^16.3.1",
        "zod": "^3.22.4",
        "jsonwebtoken": "^9.0.2",
        "bcryptjs": "^2.4.3",
        "helmet": "^7.1.0",
        "cors": "^2.8.5",
        "express-rate-limit": "^7.1.5",
        "compression": "^1.7.4",
        "winston": "^3.11.0"
    },
    "devDependencies": {
        "@types/express": "^4.17.21",
        "@types/node": "^20.10.6",
        "@types/bcryptjs": "^2.4.6",
        "@types/jsonwebtoken": "^9.0.5",
        "@types/cors": "^2.8.17",
        "@types/compression": "^1.7.5",
        "prisma": "^5.20.0",
        "tsx": "^4.7.0",
        "typescript": "^5.3.3",
        "eslint": "^8.56.0",
        "prettier": "^3.1.1"
    }
}
```

## Expected Deliverables

1. **Complete project structure** dengan layered architecture
2. **Prisma schema** dengan proper relations, indexes, dan constraints
3. **Repository pattern** untuk data access layer
4. **Service layer** dengan business logic
5. **Controllers** yang thin dan focused
6. **Middleware** untuk auth, validation, error handling
7. **Comprehensive error handling** untuk Prisma errors
8. **Transaction examples** untuk complex operations
9. **Seed file** dengan sample data
10. **Environment configuration** dengan validation
11. **TypeScript types** yang complete dan strict
12. **API documentation** dengan example requests/responses

Fokus pada **clean code, type safety, query performance, dan proper error handling**! 🚀

---

Gunakan prompt ini untuk mendapatkan implementasi API berkualitas production dengan Prisma ORM!
