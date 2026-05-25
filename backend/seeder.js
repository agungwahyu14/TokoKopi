require('dotenv').config();
const bcrypt = require('bcryptjs');
const { 
  sequelize, User, Product, Category, Store, Promo 
} = require('./models');

const seedDatabase = async () => {
  try {
    console.log('⏳ Memulai proses seeding database...');

    // Pastikan koneksi ke database berhasil
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil.');

    // Sinkronisasi model (Hapus data lama dan buat ulang tabel)
    // PERINGATAN: force: true akan menghapus semua data yang ada!
    await sequelize.sync({ force: true });
    console.log('✅ Database berhasil disinkronisasi (tabel dibersihkan).');

    // 1. Seed Kategori Produk (Konteks Indonesia)
    console.log('🌱 Seeding Kategori...');
    const categories = await Category.bulkCreate([
      { name: 'Espresso Based', description: 'Minuman kopi klasik yang diekstrak dengan tekanan tinggi.', sortOrder: 0 },
      { name: 'Manual Brew', description: 'Kopi seduh manual dengan teknik V60, Kalita, atau Aeropress.', sortOrder: 1 },
      { name: 'Signature Coffee', description: 'Menu racikan khas Toko Kopi Jaya yang tidak ada di tempat lain.', sortOrder: 2 },
      { name: 'Non-Coffee', description: 'Pilihan minuman segar bagi kamu yang tidak ingin minum kopi.', sortOrder: 3 },
      { name: 'Makanan Ringan', description: 'Camilan gurih untuk menemani waktu santaimu.', sortOrder: 4 },
      { name: 'Dessert', description: 'Makanan penutup yang manis dan menggugah selera.', sortOrder: 5 }
    ]);
    
    const catMap = {};
    categories.forEach(c => catMap[c.name] = c.id);
    console.log('✅ Kategori berhasil di-seed.');

    // 2. Seed Toko Cabang (Lokasi di Indonesia)
    console.log('🌱 Seeding Toko Cabang...');
    await Store.bulkCreate([
      { 
        name: 'Toko Kopi Jaya - Sudirman', 
        address: 'Jl. Jend. Sudirman Kav. 52-53, Senayan', 
        city: 'Jakarta Pusat', 
        phone: '021-5550123', 
        operatingHours: '07:00 - 22:00', 
        latitude: -6.224, 
        longitude: 106.809, 
        isActive: true 
      },
      { 
        name: 'Toko Kopi Jaya - Braga', 
        address: 'Jl. Braga No. 99, Sumur Bandung', 
        city: 'Bandung', 
        phone: '022-4440987', 
        operatingHours: '08:00 - 23:00', 
        latitude: -6.917, 
        longitude: 107.609, 
        isActive: true 
      },
      { 
        name: 'Toko Kopi Jaya - Tunjungan', 
        address: 'Jl. Tunjungan No. 12, Genteng', 
        city: 'Surabaya', 
        phone: '031-3330765', 
        operatingHours: '07:00 - 21:00', 
        latitude: -7.261, 
        longitude: 112.738, 
        isActive: true 
      },
      { 
        name: 'Toko Kopi Jaya - Malioboro', 
        address: 'Jl. Malioboro No. 56, Sosromenduran', 
        city: 'Yogyakarta', 
        phone: '0274-2220456', 
        operatingHours: '09:00 - 00:00', 
        latitude: -7.792, 
        longitude: 110.366, 
        isActive: true 
      }
    ]);
    console.log('✅ Toko Cabang berhasil di-seed.');

    // 3. Seed Promo / Voucher
    console.log('🌱 Seeding Promo...');
    await Promo.bulkCreate([
      { 
        code: 'KOPIJAYABARU', 
        title: 'Promo Member Baru', 
        description: 'Potongan 50% untuk pembelian pertama kamu di Toko Kopi Jaya.', 
        type: 'percent', 
        value: 50,
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'GAJIANNGOPI', 
        title: 'Promo Gajian', 
        description: 'Potongan Rp 15.000 dengan minimal belanja Rp 50.000. Saatnya self-reward!', 
        type: 'flat', 
        value: 15000,
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'DISKONPAGI', 
        title: 'Semangat Pagi', 
        description: 'Diskon 20% untuk semua jenis kopi sebelum jam 10 pagi.', 
        type: 'percent', 
        value: 20,
        imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'FREEONGKIR', 
        title: 'Gratis Ongkir', 
        description: 'Nikmati gratis ongkir flat Rp 10.000 untuk pengiriman ke seluruh area.', 
        type: 'flat', 
        value: 10000,
        imageUrl: 'https://images.unsplash.com/photo-1521220504249-140026e6f663?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'JUMATBERKAH', 
        title: 'Jumat Berkah', 
        description: 'Khusus hari Jumat, dapatkan potongan Rp 10.000 tanpa minimal belanja.', 
        type: 'flat', 
        value: 10000,
        imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'WEEKENDSERU', 
        title: 'Weekend Seru', 
        description: 'Bikin akhir pekanmu lebih manis dengan diskon 15% untuk semua menu.', 
        type: 'percent', 
        value: 15,
        imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'DOUBLETEN', 
        title: 'Promo 10.10', 
        description: 'Potongan Rp 20.000 khusus untuk kamu di tanggal cantik ini.', 
        type: 'flat', 
        value: 20000,
        imageUrl: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'NGOPIHEMAT', 
        title: 'Ngopi Hemat', 
        description: 'Diskon 10% untuk minimal belanja Rp 30.000. Ngopi enak gak harus mahal.', 
        type: 'percent', 
        value: 10,
        imageUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'STAYCATION', 
        title: 'Staycation Vibes', 
        description: 'Dapatkan diskon 12% untuk pesanan delivery selama musim liburan.', 
        type: 'percent', 
        value: 12,
        imageUrl: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      },
      { 
        code: 'MEMBERLOVALITY', 
        title: 'Voucher Loyalitas', 
        description: 'Terima kasih telah setia! Klaim voucher Rp 5.000 khusus member setia.', 
        type: 'flat', 
        value: 5000,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1000&auto=format&fit=crop',
        isActive: true 
      }
    ]);
    console.log('✅ Promo berhasil di-seed.');

    // 4. Seed Produk Menu Kopi & Lainnya (Data Realistis Indonesia)
    console.log('🌱 Seeding Produk...');
    const productsData = [
      // Espresso Based
      { name: 'Espresso Single', cat: 'Espresso Based', price: 15000, stock: 100, desc: 'Ekstrak kopi murni yang kuat dan intens.' },
      { name: 'Americano Hot/Iced', cat: 'Espresso Based', price: 22000, stock: 100, desc: 'Espresso dengan tambahan air panas atau es.' },
      { name: 'Caffe Latte', cat: 'Espresso Based', price: 28000, stock: 80, desc: 'Perpaduan espresso dengan susu lembut.' },
      { name: 'Cappuccino', cat: 'Espresso Based', price: 30000, stock: 80, desc: 'Espresso dengan susu dan busa susu yang tebal.' },
      { name: 'Caramel Macchiato', cat: 'Espresso Based', price: 35000, stock: 50, desc: 'Latte manis dengan sirup karamel.' },

      // Manual Brew
      { name: 'V60 Gayo Aceh', cat: 'Manual Brew', price: 32000, stock: 30, desc: 'Kopi aromatik dengan rasa buah yang segar.' },
      { name: 'V60 Toraja Sapan', cat: 'Manual Brew', price: 32000, stock: 30, desc: 'Kopi dengan body yang tebal dan aroma tanah.' },
      { name: 'V60 Bali Kintamani', cat: 'Manual Brew', price: 30000, stock: 30, desc: 'Kopi dengan nuansa rasa jeruk yang unik.' },
      { name: 'Vietnam Drip', cat: 'Manual Brew', price: 25000, stock: 50, desc: 'Kopi robusta dengan susu kental manis.' },
      { name: 'Kopi Tubruk Tubaba', cat: 'Manual Brew', price: 18000, stock: 100, desc: 'Kopi hitam tradisional tanpa ampas yang disaring.' },

      // Signature Coffee
      { name: 'Kopi Susu Gula Aren Jaya', cat: 'Signature Coffee', price: 25000, stock: 200, desc: 'Kopi susu andalan dengan pemanis gula aren alami.' },
      { name: 'Kopi Pandan Latte', cat: 'Signature Coffee', price: 32000, stock: 50, desc: 'Perpaduan kopi, susu, dan aroma pandan yang wangi.' },
      { name: 'Avocado Coffee', cat: 'Signature Coffee', price: 38000, stock: 40, desc: 'Jus alpukat segar dengan shot espresso di atasnya.' },
      { name: 'Es Kopi Klepon', cat: 'Signature Coffee', price: 30000, stock: 40, desc: 'Sensasi rasa kue tradisional klepon dalam segelas kopi.' },

      // Non-Coffee
      { name: 'Matcha Latte', cat: 'Non-Coffee', price: 32000, stock: 60, desc: 'Teh hijau Jepang berkualitas dengan susu.' },
      { name: 'Chocolate Signature', cat: 'Non-Coffee', price: 35000, stock: 60, desc: 'Cokelat premium yang kental dan tidak terlalu manis.' },
      { name: 'Thai Tea Iced', cat: 'Non-Coffee', price: 24000, stock: 100, desc: 'Teh khas Thailand dengan rempah dan susu.' },
      { name: 'Red Velvet Latte', cat: 'Non-Coffee', price: 32000, stock: 50, desc: 'Minuman berwarna merah dengan rasa cake yang creamy.' },

      // Makanan Ringan
      { name: 'Cireng Bumbu Rujak', cat: 'Makanan Ringan', price: 22000, stock: 40, desc: 'Cireng renyah dengan sambal rujak pedas manis.' },
      { name: 'Singkong Goreng Keju', cat: 'Makanan Ringan', price: 25000, stock: 40, desc: 'Singkong merekah yang disajikan dengan parutan keju.' },
      { name: 'Pisang Goreng Madu', cat: 'Makanan Ringan', price: 28000, stock: 30, desc: 'Pisang goreng manis karamel dengan wijen.' },
      { name: 'French Fries Jaya', cat: 'Makanan Ringan', price: 25000, stock: 50, desc: 'Kentang goreng gurih dengan bumbu rahasia.' },

      // Dessert
      { name: 'Roti Bakar Coklat Keju', cat: 'Dessert', price: 28000, stock: 30, desc: 'Roti bakar tebal dengan melimpah coklat dan keju.' },
      { name: 'Brownies Ice Cream', cat: 'Dessert', price: 35000, stock: 20, desc: 'Brownies coklat hangat dengan satu scoop es krim vanilla.' },
      { name: 'Croissant Butter', cat: 'Dessert', price: 25000, stock: 20, desc: 'Pastry khas Perancis yang renyah dan buttery.' }
    ];

    const formattedProducts = productsData.map(p => ({
      name: p.name,
      description: p.desc,
      price: p.price,
      categoryId: catMap[p.cat],
      stock: p.stock,
      imageUrl: `https://images.unsplash.com/photo-${1500 + Math.floor(Math.random() * 500)}?q=80&w=500&auto=format&fit=crop`,
      isAvailable: true
    }));

    await Product.bulkCreate(formattedProducts);
    console.log('✅ Produk berhasil di-seed.');

    // 5. Seed Admin User (Opsional tapi berguna)
    console.log('🌱 Seeding Admin User...');
    await User.create({
      name: 'Administrator Jaya',
      email: 'admin@tokokopijaya.com',
      password: 'admin123',
      role: 'admin',
      phone: '081234567890'
    });
    console.log('✅ Admin User berhasil di-seed.');

    console.log('\n✨ PROSES SEEDING SELESAI DENGAN SUKSES! ✨');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
