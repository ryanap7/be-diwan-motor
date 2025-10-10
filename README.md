# 🔧 HD MOTOPART Inventory API

REST API untuk Sistem Manajemen Inventory HD MOTOPART menggunakan Express.js, TypeScript, PostgreSQL, dan Prisma ORM.

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT
- **Logging**: Winston

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Data access layer
├── middlewares/     # Express middlewares
├── routes/          # API routes
├── types/           # TypeScript types
├── utils/           # Utility functions
└── validators/      # Zod schemas
```

## 🛠️ Installation

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### Setup Steps

1. **Clone repository**

```bash
git clone <repository-url>
cd be-diwan-motor
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

4. **Setup database**

```bash
# Create PostgreSQL database
createdb db_hdmotopart

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

5. **Run development server**

```bash
npm run dev
```

Server akan berjalan di `http://localhost:8000`

## 📝 Available Scripts

| Command                   | Description                                |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Start development server dengan hot reload |
| `npm run build`           | Build untuk production                     |
| `npm start`               | Start production server                    |
| `npm run prisma:generate` | Generate Prisma Client                     |
| `npm run prisma:migrate`  | Run database migrations                    |
| `npm run prisma:studio`   | Open Prisma Studio                         |
| `npm run prisma:seed`     | Seed database                              |
| `npm run lint`            | Run ESLint                                 |
| `npm run format`          | Format code dengan Prettier                |

## 🔐 Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan dengan konfigurasi Anda:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL="postgresql://user:password@localhost:5432/db_hdmotopart"
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

Lihat `.env.example` untuk daftar lengkap environment variables.

## 📚 API Modules

### Planned Modules:

- [ ] Authentication & Authorization
- [ ] Products/Spare Parts Management
- [ ] Suppliers Management
- [ ] Purchase Orders
- [ ] Stock Transactions
- [ ] Reports & Analytics

## 🗄️ Database Schema

Database schema akan didefinisikan di `prisma/schema.prisma`.

## 🧪 Testing

```bash
# Run tests (coming soon)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📖 API Documentation

API documentation akan tersedia di:

- Development: `http://localhost:8000/api/v1/docs`
- Swagger/OpenAPI spec (coming soon)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License

## 👨‍💻 Author

Your Name

---

**Status**: 🚧 In Development
