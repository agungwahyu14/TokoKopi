# 📋 Panduan Testing — Alur Order End-to-End
### Toko Kopi Jaya · Backend API

> Panduan ini mencakup semua langkah pengujian dari **login** hingga **order selesai**, termasuk integrasi **Midtrans** (pembayaran) dan **Biteship** (pengiriman), serta webhook yang perlu dikonfigurasi.

---

## 🗂️ Daftar Isi

1. [Prasyarat & Setup](#1-prasyarat--setup)
2. [Konfigurasi Webhook](#2-konfigurasi-webhook)
3. [Peta Endpoint API](#3-peta-endpoint-api)
4. [Alur Testing Pickup](#4-alur-testing--pickup-ambil-sendiri)
5. [Alur Testing Delivery](#5-alur-testing--delivery-pengiriman)
6. [Simulasi Webhook Midtrans](#6-simulasi-webhook-midtrans)
7. [Simulasi Webhook Biteship](#7-simulasi-webhook-biteship)
8. [Status Order & Transisi](#8-status-order--transisi)
9. [Contoh Request & Response](#9-contoh-request--response)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prasyarat & Setup

### 1.1 Menjalankan Server

```bash
# Terminal 1 — Backend
cd backend
npm run dev          # Server berjalan di http://localhost:5000

# Terminal 2 — Buka tunnel publik untuk webhook
ngrok http 5000
```

Catat URL ngrok yang muncul, misalnya:
```
https://xxxx-xx-xx-xxx-xx.ngrok-free.app
```

### 1.2 Variabel Lingkungan (`.env`)

```env
PORT=5000
NODE_ENV=development

# MySQL
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=toko_kopi_jaya
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# URL publik (dari ngrok)
BACKEND_URL=https://xxxx-xx-xx-xxx-xx.ngrok-free.app

# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false

# Biteship
BITESHIP_API_KEY=biteship_test.xxxxxxxxxxxx
```

---

## 2. Konfigurasi Webhook

### 2.1 Midtrans — Payment Notification Webhook

**URL Webhook yang harus didaftarkan:**
```
POST {BACKEND_URL}/api/notification
```

**Cara mendaftarkan:**
1. Login ke [Midtrans Dashboard Sandbox](https://dashboard.sandbox.midtrans.com)
2. Masuk ke **Settings → Configuration**
3. Isi kolom **Payment Notification URL**:
   ```
   https://xxxx-xx-xx-xxx-xx.ngrok-free.app/api/notification
   ```
4. Klik **Update**

**Payload yang diterima dari Midtrans:**

| Field | Keterangan |
|---|---|
| `transaction_status` | Status transaksi (`settlement`, `pending`, `deny`, `cancel`, `expire`) |
| `order_id` | Nomor order kita (format `JKT-xxxxx-xxx`) |
| `gross_amount` | Total pembayaran |
| `status_code` | Kode status HTTP Midtrans |
| `signature_key` | Hash SHA-512 untuk verifikasi |
| `payment_type` | Metode bayar (`bank_transfer`, `qris`, `cstore`, dsb.) |
| `va_numbers` | Array VA jika menggunakan transfer bank |
| `bank` | Nama bank jika ada |
| `store` | Nama minimarket jika pembayaran via Alfamart/Indomaret |

**Contoh Payload Midtrans Settlement:**
```json
{
  "transaction_status": "settlement",
  "order_id": "JKT-1716000000000-123",
  "gross_amount": "55000.00",
  "status_code": "200",
  "signature_key": "...",
  "payment_type": "bank_transfer",
  "va_numbers": [{ "bank": "bca", "va_number": "1234567890" }]
}
```

---

### 2.2 Biteship — Delivery Status Webhook

**URL Webhook yang harus didaftarkan:**
```
POST {BACKEND_URL}/api/shipping/webhook
```

**Cara mendaftarkan:**
1. Login ke [Biteship Dashboard](https://biteship.com/id/dashboard)
2. Masuk ke **Settings → Webhook**
3. Tambahkan URL webhook:
   ```
   https://xxxx-xx-xx-xxx-xx.ngrok-free.app/api/shipping/webhook
   ```
4. Pilih event yang di-subscribe: **`order.status`**
5. Simpan pengaturan

**Payload yang diterima dari Biteship:**

| Field | Keterangan |
|---|---|
| `event` | Tipe event (selalu `order.status`) |
| `status` | Status kurir (lihat tabel di bawah) |
| `order_id` | ID order Biteship internal |
| `reference_id` | Nomor order kita (format `JKT-xxxxx-xxx-Rxxxxxxxxxx`) |
| `waybill_id` | Nomor resi pengiriman |
| `courier` | Info kurir (nama, kode, no. telepon driver) |

**Mapping Status Biteship → Status Order Internal:**

| Status Biteship | Status Order Internal | Keterangan |
|---|---|---|
| `allocated` | `on_delivery` | Driver ditugaskan |
| `picking_up` | `on_delivery` | Driver sedang menuju toko |
| `picked_up` | `on_delivery` | Driver sudah ambil pesanan |
| `dropping_off` | `on_delivery` | Driver menuju pelanggan |
| `delivered` | `completed` | Pesanan terdelivered ✅ |
| `cancelled` | `processing` | Gagal, perlu minta kurir ulang |
| `rejected` | `processing` | Ditolak, perlu minta kurir ulang |
| `returned` | `processing` | Dikembalikan, perlu minta kurir ulang |

**Contoh Payload Biteship:**
```json
{
  "event": "order.status",
  "status": "delivered",
  "order_id": "biteship_order_id_xxx",
  "reference_id": "JKT-1716000000000-123-R1716001234567",
  "waybill_id": "GRB-XXXXXX",
  "courier": {
    "company": "grab",
    "name": "Budi Driver",
    "phone": "08123456789"
  }
}
```

---

## 3. Peta Endpoint API

**Base URL:** `http://localhost:5000` (atau URL ngrok)

### 🔐 Auth

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/api/auth/request-otp` | ❌ | Request OTP ke nomor HP |
| `POST` | `/api/auth/verify-otp` | ❌ | Verifikasi OTP, buat akun baru |
| `POST` | `/api/auth/verify-pin` | ❌ | Login dengan PIN |
| `POST` | `/api/auth/login` | ❌ | Login admin (email + password) |
| `GET` | `/api/auth/me` | ✅ | Profil user yang login |
| `POST` | `/api/auth/logout` | ✅ | Logout |

### 🛒 Cart

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/api/cart` | ✅ | Lihat isi keranjang |
| `POST` | `/api/cart` | ✅ | Tambah item ke keranjang |
| `PUT` | `/api/cart/:id` | ✅ | Update kuantitas item |
| `DELETE` | `/api/cart/:id` | ✅ | Hapus item dari keranjang |

### 📦 Order

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/api/orders/checkout` | ✅ Customer | Checkout dari keranjang → buat order |
| `POST` | `/api/orders` | ✅ Customer | Buat order langsung (tanpa keranjang) |
| `GET` | `/api/orders` | ✅ | Daftar order (customer: milik sendiri, admin: semua) |
| `GET` | `/api/orders/:id` | ✅ | Detail order by ID |
| `PATCH` | `/api/orders/:id/status` | ✅ Admin | Update status order |
| `PUT` | `/api/orders/:id/status` | ✅ Admin | Update status order (alias) |

### 💳 Payment (Midtrans)

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/api/orders/:id/pay` | ✅ Customer | Buat token pembayaran Midtrans Snap |
| `POST` | `/api/notification` | ❌ | **Webhook Midtrans** (dipanggil otomatis) |
| `GET` | `/api/payment/finish` | ❌ | Callback setelah pembayaran selesai |

### 🚚 Shipping (Biteship)

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/api/shipping/rates` | ✅ Customer | Cek ongkir (Grab/GoSend) |
| `POST` | `/api/shipping/request-delivery/:orderId` | ✅ Admin | Dispatch kurir ke Biteship |
| `GET` | `/api/shipping/tracking/:orderId` | ✅ Customer | Lacak status pengiriman |
| `POST` | `/api/shipping/webhook` | ❌ | **Webhook Biteship** (dipanggil otomatis) |

### 🏪 Lain-lain

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/api/products` | ❌ | Daftar produk |
| `GET` | `/api/stores` | ❌ | Daftar toko/cabang |
| `GET` | `/api/categories` | ❌ | Daftar kategori |
| `GET` | `/api/promos` | ✅ | Daftar promo |
| `POST` | `/api/ratings` | ✅ Customer | Beri rating pesanan |

---

## 4. Alur Testing — Pickup (Ambil Sendiri)

```
Login → Tambah Keranjang → Checkout → Bayar → Admin Konfirmasi → Siap Diambil → Selesai
```

### Step 1 — Login

```http
POST /api/auth/verify-pin
Content-Type: application/json

{
  "phone": "08123456789",
  "pin": "123456"
}
```

**Respon:** Simpan `token` dari response body.

---

### Step 2 — Cek Produk

```http
GET /api/products
```

**Catat:** `id` produk yang ingin dipesan.

---

### Step 3 — Tambah ke Keranjang

```http
POST /api/cart
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2,
  "notes": "Tanpa gula"
}
```

---

### Step 4 — Checkout

```http
POST /api/orders/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "storeId": 1,
  "orderType": "pickup",
  "paymentMethod": "midtrans",
  "notes": "Tolong dibungkus rapi"
}
```

**Respon:** Simpan `data.id` sebagai `{orderId}`.

---

### Step 5 — Buat Token Pembayaran Midtrans

```http
POST /api/orders/{orderId}/pay
Authorization: Bearer {token}
```

**Respon:**
```json
{
  "success": true,
  "data": {
    "token": "midtrans-snap-token-xxxx",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "orderNumber": "JKT-xxxxx-xxx"
  }
}
```

Buka `redirectUrl` di browser untuk menyelesaikan pembayaran (sandbox).

---

### Step 6 — (Otomatis) Webhook Midtrans Diterima

Setelah bayar, Midtrans mengirim webhook ke:
```
POST /api/notification
```
- Jika `transaction_status = settlement` → status order berubah ke **`processing`**
- Jika `transaction_status = pending` → status order tetap **`pending_payment`**
- Poin user ditambahkan (1 poin per Rp 10.000)

---

### Step 7 — Admin Update Status ke `confirmed`

```http
PATCH /api/orders/{orderId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "confirmed"
}
```

---

### Step 8 — Admin Update Status ke `ready_for_pickup`

```http
PATCH /api/orders/{orderId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "ready_for_pickup"
}
```

---

### Step 9 — Admin Update Status ke `completed`

```http
PATCH /api/orders/{orderId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "completed"
}
```

✅ **Order Pickup selesai!** Poin tambahan diberikan kepada user.

---

## 5. Alur Testing — Delivery (Pengiriman)

```
Login → Cek Ongkir → Tambah Keranjang → Checkout (delivery) → Bayar → (Otomatis) Dispatch Kurir → Webhook Biteship → Selesai
```

### Step 1-2 — Login & Cek Produk

*Sama seperti alur Pickup Step 1-2.*

---

### Step 3 — Cek Ongkir

```http
POST /api/shipping/rates
Authorization: Bearer {token}
Content-Type: application/json

{
  "storeId": 1,
  "destinationLatitude": -6.200000,
  "destinationLongitude": 106.816666,
  "items": [
    {
      "name": "Kopi Arabica",
      "value": 35000,
      "quantity": 2,
      "weight": 300
    }
  ]
}
```

**Respon:** Pilih kurir dari array `data`. Catat `courier_code` dan `courier_service_code`.

---

### Step 4 — Tambah ke Keranjang

```http
POST /api/cart
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

---

### Step 5 — Checkout Delivery

```http
POST /api/orders/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "storeId": 1,
  "orderType": "delivery",
  "paymentMethod": "midtrans",
  "shippingCost": 15000,
  "courierCode": "gosend",
  "courierService": "instant",
  "deliveryAddress": "Jl. Sudirman No. 1, Jakarta Selatan",
  "deliveryLatitude": -6.200000,
  "deliveryLongitude": 106.816666,
  "receiverName": "Budi Santoso",
  "receiverPhone": "08123456789",
  "notes": "Tolong taruh di depan pintu"
}
```

**Respon:** Simpan `data.id` sebagai `{orderId}`.

---

### Step 6 — Buat Token Pembayaran Midtrans

```http
POST /api/orders/{orderId}/pay
Authorization: Bearer {token}
```

Buka `redirectUrl` di browser dan selesaikan pembayaran.

---

### Step 7 — (Otomatis) Webhook Midtrans → Dispatch Kurir

Setelah pembayaran `settlement`, sistem secara otomatis memanggil:

1. **Webhook Midtrans** diterima di `/api/notification`
2. Status order → `processing`
3. Karena `orderType = delivery`, sistem **otomatis** meminta kurir ke Biteship
4. Status order → `on_delivery`
5. `biteshipOrderId` disimpan di database

> ⚠️ **Catatan:** Dispatch kurir otomatis terjadi saat webhook `settlement` diterima. Untuk delivery, admin bisa juga trigger manual jika perlu retry.

---

### Step 8 — (Opsional) Admin Manual Dispatch Kurir

Jika perlu retry (misalnya kurir ditolak):

```http
POST /api/shipping/request-delivery/{orderId}
Authorization: Bearer {admin_token}
```

---

### Step 9 — (Otomatis) Webhook Biteship Diterima

Biteship mengirim update status ke:
```
POST /api/shipping/webhook
```

Payload yang dikirim Biteship untuk berbagai event:

| Event | Status Biteship | Status Order |
|---|---|---|
| Driver ditugaskan | `allocated` | `on_delivery` |
| Driver menuju toko | `picking_up` | `on_delivery` |
| Driver ambil pesanan | `picked_up` | `on_delivery` |
| Driver menuju pelanggan | `dropping_off` | `on_delivery` |
| Terdelivered ✅ | `delivered` | `completed` |
| Gagal/Dibatalkan | `cancelled` / `rejected` | `processing` |

---

### Step 10 — Cek Tracking

```http
GET /api/shipping/tracking/{orderId}
Authorization: Bearer {token}
```

---

## 6. Simulasi Webhook Midtrans

Untuk testing tanpa benar-benar bayar, gunakan **Midtrans Simulator** atau curl:

### Via Midtrans Dashboard (Direkomendasikan)
1. Buka [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com)
2. Masuk ke **Transactions** → cari order
3. Klik tombol **Accept / Deny** untuk simulasi

### Via cURL Manual

```bash
# Ganti nilai-nilai berikut:
ORDER_NUMBER="JKT-1716000000000-123"
GROSS_AMOUNT="55000.00"
STATUS_CODE="200"
SERVER_KEY="SB-Mid-server-xxxxxxxxxxxxxxxxxxxx"

# Hitung signature
SIGNATURE=$(echo -n "${ORDER_NUMBER}${STATUS_CODE}${GROSS_AMOUNT}${SERVER_KEY}" | sha512sum | awk '{print $1}')

curl -X POST http://localhost:5000/api/notification \
  -H "Content-Type: application/json" \
  -d "{
    \"transaction_status\": \"settlement\",
    \"order_id\": \"${ORDER_NUMBER}\",
    \"gross_amount\": \"${GROSS_AMOUNT}\",
    \"status_code\": \"${STATUS_CODE}\",
    \"signature_key\": \"${SIGNATURE}\",
    \"payment_type\": \"bank_transfer\",
    \"va_numbers\": [{\"bank\": \"bca\", \"va_number\": \"1234567890\"}]
  }"
```

---

## 7. Simulasi Webhook Biteship

Untuk testing status pengiriman tanpa kurir nyata:

```bash
# Update ke status "delivered"
curl -X POST http://localhost:5000/api/shipping/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.status",
    "status": "delivered",
    "order_id": "biteship_order_id_xxx",
    "reference_id": "JKT-1716000000000-123-R1716001234567",
    "waybill_id": "GRB-123456",
    "courier": {
      "company": "grab",
      "name": "Budi Driver",
      "phone": "081234567890"
    }
  }'

# Update ke status "allocated" (driver ditugaskan)
curl -X POST http://localhost:5000/api/shipping/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.status",
    "status": "allocated",
    "order_id": "biteship_order_id_xxx",
    "reference_id": "JKT-1716000000000-123-R1716001234567"
  }'
```

> 💡 **Tips:** `reference_id` boleh mengandung suffix `-Rxxxxxxxxxx` (timestamp retry), sistem akan otomatis strip suffix tersebut untuk mencari order.

---

## 8. Status Order & Transisi

```
pending
  │
  ▼ (saat /pay dipanggil)
pending_payment
  │
  ├─▶ cancelled  (payment deny/cancel/expire)
  │
  ▼ (Midtrans settlement)
processing
  │
  ├─[PICKUP]──▶ confirmed
  │                │
  │                ▼
  │          ready_for_pickup
  │                │
  │                ▼
  │            completed ✅
  │
  └─[DELIVERY]─▶ on_delivery  (otomatis saat dispatch kurir)
                     │
                     ├─▶ processing  (kurir gagal/tolak → retry)
                     │
                     ▼
                 completed ✅ (Biteship webhook: delivered)
```

**Nilai status yang valid:**

| Status | Keterangan |
|---|---|
| `pending` | Order baru dibuat, belum ada aksi pembayaran |
| `pending_payment` | Menunggu konfirmasi pembayaran dari Midtrans |
| `confirmed` | Admin konfirmasi order |
| `processing` | Pembayaran diterima, sedang diproses |
| `ready_for_pickup` | Khusus pickup: pesanan siap diambil |
| `on_delivery` | Khusus delivery: pesanan sedang diantar |
| `completed` | Order selesai ✅ |
| `cancelled` | Dibatalkan (payment gagal) |

---

## 9. Contoh Request & Response

### Checkout Response

```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat",
  "data": {
    "id": 42,
    "orderNumber": "JKT-1716000000000-123",
    "status": "pending",
    "orderType": "delivery",
    "subtotal": 70000,
    "discount": 0,
    "tax": 7000,
    "shippingCost": 15000,
    "finalAmount": 92000,
    "courierCode": "gosend",
    "courierService": "instant",
    "deliveryAddress": "Jl. Sudirman No. 1, Jakarta Selatan",
    "receiverName": "Budi Santoso",
    "receiverPhone": "08123456789",
    "items": [...]
  }
}
```

### Get Order Detail Response

```json
{
  "success": true,
  "data": {
    "id": 42,
    "orderNumber": "JKT-1716000000000-123",
    "status": "on_delivery",
    "biteshipOrderId": "biteship_order_id_xxx",
    "paymentMethod": "bank_transfer (BCA)",
    "vaNumber": "1234567890",
    "bankName": "bca",
    "user": { "id": 1, "name": "Budi", "phone": "08123456789" },
    "store": { "id": 1, "name": "Cabang Sudirman" },
    "items": [...],
    "createdAt": "2026-05-17T10:00:00.000Z"
  }
}
```

---

## 10. Troubleshooting

### ❌ Webhook Midtrans: "Invalid signature"
- Pastikan `MIDTRANS_SERVER_KEY` di `.env` sama persis dengan yang ada di dashboard Midtrans.
- Format hash: `SHA512(order_id + status_code + gross_amount + ServerKey)`

### ❌ Biteship: "Reference id already used"
- Sistem otomatis menambahkan suffix `-Rxxxxxxxxxx` (timestamp) untuk setiap percobaan dispatch.
- Jika masih error, pastikan tidak ada race condition antar request.

### ❌ Biteship: "No sufficient balance"
- Saldo Biteship test habis. Sistem akan fallback ke **mock rates** otomatis.
- Mock rates menggunakan GoSend Instant (Rp 15.000) dan GrabExpress (Rp 16.000).

### ❌ Webhook tidak diterima
- Pastikan ngrok aktif dan URL sudah diupdate di dashboard Midtrans/Biteship.
- Cek log server untuk memastikan request masuk.
- Pastikan endpoint tidak memerlukan auth (webhook harus bisa diakses publik).

### ❌ Same Day courier error
- GoSend/Grab Same Day hanya tersedia **09:00–14:00 WIB**.
- Di luar jam tersebut, sistem otomatis switch ke **Instant**.

### 🔍 Cek Log Server

```bash
# Lihat log real-time
npm run dev

# Filter log webhook
npm run dev 2>&1 | grep -E "(Webhook|webhook|Midtrans|Biteship)"
```

---

> **📝 Catatan:** Semua endpoint yang bertanda ✅ di kolom Auth memerlukan header:
> ```
> Authorization: Bearer {token}
> ```
> Token didapatkan dari response login (`/api/auth/verify-pin` atau `/api/auth/login`).
