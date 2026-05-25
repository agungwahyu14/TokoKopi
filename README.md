# ☕ Toko Kopi Jaya

> Aplikasi pemesanan kopi modern dengan ekosistem lengkap: mobile app, admin dashboard, dan REST API backend.

---

## 📁 Struktur Monorepo

```
toko-kopi-jaya/
├── backend/        # REST API — Node.js + Express + MySQL (Sequelize)
├── admin/          # Dashboard Admin — Next.js 16 + Tailwind CSS
└── mobile/         # Aplikasi Mobile — React Native (Expo)
```

---

## 🚀 Tech Stack

### 🔧 Backend (`/backend`)
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Node.js | ≥18 | Runtime |
| Express.js | ^4.19 | HTTP Framework |
| Sequelize | ^6.37 | ORM |
| MySQL2 | ^3.9 | Database Driver |
| JSON Web Token | ^9.0 | Autentikasi |
| Midtrans Client | ^1.4 | Payment Gateway |
| Multer | ^2.1 | Upload File |
| bcryptjs | ^2.4 | Hash Password |
| Expo Server SDK | ^6.1 | Push Notification |

### 🖥️ Admin Dashboard (`/admin`)
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Next.js | 16.2 | React Framework |
| React | 19.2 | UI Library |
| Tailwind CSS | ^4 | Styling |
| TanStack Query | ^5 | Server State Management |
| Zustand | ^5 | Client State Management |
| Recharts | ^3.8 | Grafik & Laporan |
| React Hook Form | ^7 | Form Management |
| Zod | ^4 | Validasi Schema |
| Axios | ^1.16 | HTTP Client |

### 📱 Mobile App (`/mobile`)
| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| React Native | 0.81.5 | Mobile Framework |
| Expo | ~54.0 | Development Platform |
| Expo Router | ~6.0 | File-based Navigation |
| TypeScript | ~5.9 | Type Safety |
| TanStack Query | ^5 | Server State Management |
| Zustand | ^5 | Client State Management |
| React Hook Form + Zod | ^7 / ^4 | Form & Validasi |
| React Native Maps | 1.20 | Peta Interaktif |
| Expo Notifications | ~0.32 | Push Notification |
| Expo Location | ~19.0 | Lokasi GPS |
| Midtrans WebView | — | Pembayaran In-App |

---

## ✨ Fitur Utama

### 👤 Pengguna (Mobile App)
- Registrasi & login dengan PIN autentikasi
- Browse menu produk berdasarkan kategori
- Keranjang belanja & checkout
- Pemilihan metode pengiriman (Biteship) & pickup
- Pembayaran via Midtrans (berbagai metode)
- Tracking status pesanan secara real-time
- Sistem poin loyalitas & penukaran promo
- Manajemen alamat pengiriman dengan peta interaktif
- Push notification untuk update pesanan
- Riwayat pesanan & detail transaksi

### 🛡️ Admin (Dashboard)
- Login & manajemen sesi admin
- Dashboard statistik & grafik penjualan (Recharts)
- Manajemen produk (CRUD + upload gambar)
- Manajemen kategori produk
- Manajemen pesanan & update status
- Dispatch pengiriman via Biteship
- Manajemen pelanggan & poin loyalitas
- Manajemen promo & voucher
- Manajemen toko
- Notifikasi real-time
- Laporan penjualan

### ⚙️ Backend API
- RESTful API dengan 14+ route grup
- JWT Authentication & Role-based Authorization
- Integrasi Midtrans untuk payment gateway
- Integrasi Biteship untuk layanan pengiriman kurir
- Push Notification via Expo Server SDK
- Upload & serving file statis (gambar produk, promo)
- Sequelize ORM dengan MySQL (auto-sync schema)
- Centralized error handling

---

## 🛠️ Instalasi & Setup

### Prasyarat
- Node.js ≥ 18
- MySQL 8+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Akun [Midtrans](https://midtrans.com/) (Sandbox untuk development)
- Akun [Biteship](https://biteship.com/) (untuk pengiriman)
- [ngrok](https://ngrok.com/) (untuk expose backend ke device fisik)

---

### 1. Clone Repository

```bash
git clone https://github.com/agungwahyu14/toko-kopi.git
cd toko-kopi
```

---

### 2. Setup Backend

```bash
cd backend
npm install
```

Buat file `.env` berdasarkan `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=toko_kopi_jaya
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Midtrans
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

# Biteship
BITESHIP_API_KEY=your_biteship_api_key

# Ngrok (untuk webhook & push notification)
NGROK_URL=https://your-ngrok-url.ngrok-free.app
```

Buat database MySQL dan jalankan seeder:

```bash
# Buat database terlebih dahulu di MySQL
mysql -u root -p -e "CREATE DATABASE toko_kopi_jaya;"

# Jalankan migrasi & seeder
npm run setup

# Atau jalankan server (auto-sync schema via Sequelize)
npm run dev
```

---

### 3. Setup Admin Dashboard

```bash
cd admin
npm install
```

Buat file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Jalankan development server:

```bash
npm run dev
# Buka http://localhost:3000
```

---

### 4. Setup Mobile App

```bash
cd mobile
npm install
```

Update `BASE_URL` di `services/api.ts` dengan URL backend (atau ngrok URL untuk device fisik):

```ts
const BASE_URL = 'http://localhost:5000/api'; // emulator
// atau
const BASE_URL = 'https://your-ngrok-url.ngrok-free.app/api'; // device fisik
```

Jalankan Expo:

```bash
npx expo start

# Pilih platform:
# a → Android Emulator
# i → iOS Simulator
# Scan QR → Expo Go (device fisik)
```

---

## 📡 API Endpoints

| Prefix | Keterangan |
|--------|------------|
| `GET /` | Health check API |
| `/api/auth` | Autentikasi (login, register, PIN) |
| `/api/products` | Produk menu |
| `/api/categories` | Kategori produk |
| `/api/orders` | Pesanan |
| `/api/cart` | Keranjang belanja |
| `/api/users` | Profil & data pengguna |
| `/api/admin` | Endpoint khusus admin |
| `/api/stores` | Info toko |
| `/api/promos` | Promo & voucher |
| `/api/shipping` | Pengiriman (Biteship) |
| `/api/ratings` | Rating & ulasan |
| `/api/notifications` | Push notification |
| `/api/payment/*` | Payment (Midtrans) & webhook |
| `/api/admin/reports` | Laporan penjualan |

---

## 🗄️ Database Models

| Model | Keterangan |
|-------|------------|
| `User` | Data pengguna & admin |
| `Product` | Produk menu kopi |
| `Category` | Kategori produk |
| `Order` | Data pesanan |
| `OrderItem` | Detail item per pesanan |
| `CartItem` | Item keranjang belanja |
| `Address` | Alamat pengiriman pengguna |
| `Store` | Info toko fisik |
| `Promo` | Promo & voucher |
| `UserPromo` | Relasi penggunaan promo oleh user |
| `Rating` | Rating & ulasan produk |
| `Notification` | Notifikasi pengguna |

---

## 🔄 Alur Pesanan

```
User pilih produk → Tambah ke keranjang
    → Checkout (pilih tipe: Delivery / Pickup)
    → Pilih alamat & kurir (Biteship) atau toko
    → Pilih promo (opsional)
    → Pembayaran via Midtrans (WebView)
    → Webhook konfirmasi pembayaran
    → Admin proses pesanan
    → Dispatch kurir (Biteship) / siap pickup
    → Pesanan selesai → Poin loyalitas ditambahkan
```

---

## 🌐 Webhook & Ngrok

Untuk testing di device fisik atau integrasi Midtrans/Biteship, backend perlu dapat diakses dari internet menggunakan ngrok:

```bash
# Install ngrok lalu jalankan:
ngrok http 5000
```

Salin URL ngrok (contoh: `https://abc123.ngrok-free.app`) dan:
1. Update `NGROK_URL` di `.env` backend
2. Daftarkan sebagai **Notification URL** di dashboard Midtrans:  
   `https://abc123.ngrok-free.app/api/payment/notification`
3. Daftarkan sebagai **Webhook URL** di dashboard Biteship:  
   `https://abc123.ngrok-free.app/api/shipping/webhook`

---

## 👨‍💻 Development Scripts

### Backend
```bash
npm run dev      # Jalankan dengan nodemon (hot-reload)
npm run start    # Jalankan production
npm run migrate  # Jalankan migrasi
npm run seed     # Jalankan seeder
npm run setup    # Migrate + Seed sekaligus
```

### Admin
```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Build production
npm run start    # Jalankan production build
npm run lint     # Cek linting
```

### Mobile
```bash
npx expo start          # Jalankan Expo dev server
npx expo start --android # Langsung ke Android
npx expo start --ios     # Langsung ke iOS
npm run lint             # Cek linting
```

---

## 📄 Lisensi

MIT License © 2025 Agung Wahyu
