require('dotenv').config();
const bcrypt = require('bcryptjs');
const { 
  sequelize, User, Product, Category, Store, Promo 
} = require('../models');

// Gambar Unsplash Valid
const coffeeImages = [
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1485808191679-5f86510df729?w=500&auto=format&fit=crop',
];

const nonCoffeeImages = [
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&auto=format&fit=crop',
];

const foodImages = [
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=500&auto=format&fit=crop',
];

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected for seeding.');

    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized and cleared.');

    // 1. Create Categories (Flat structure)
    const categories = {
      coffee: await Category.create({ name: 'Coffee' }),
      nonCoffee: await Category.create({ name: 'Non-Coffee' }),
      food: await Category.create({ name: 'Food' }),
      promo: await Category.create({ name: 'Promo & Combo' }),
      baru: await Category.create({ name: 'Baru' }),
      popular: await Category.create({ name: 'Popular' })
    };
    console.log('✅ Categories seeded.');

    // 2. Seed Stores (Bali)
    await Store.bulkCreate([
      {
        name: "Toko Kopi Jaya Denpasar",
        address: "Jl. Teuku Umar No. 123, Denpasar",
        city: "Denpasar",
        province: "Bali",
        latitude: -8.6478,
        longitude: 115.2166,
        phone: "0361-123456",
        openTime: "07:00",
        closeTime: "22:00",
        isActive: true,
      },
      {
        name: "Toko Kopi Jaya Kuta",
        address: "Jl. Pantai Kuta No. 45, Kuta",
        city: "Kuta",
        province: "Bali",
        latitude: -8.7190,
        longitude: 115.1700,
        phone: "0361-654321",
        openTime: "08:00",
        closeTime: "23:00",
        isActive: true,
      },
    ]);

    // 3. Seed Promos
    await Promo.bulkCreate([
      { code: 'JAYABALI', title: 'Opening Bali', description: 'Potongan 30% all menu.', type: 'percent', value: 30, imageUrl: coffeeImages[0] },
      { code: 'NGOPIHEMAT', title: 'Ngopi Hemat', description: 'Potongan Rp 10.000.', type: 'flat', value: 10000, imageUrl: coffeeImages[1] }
    ]);

    // 4. Seed Products (Total 50)
    const productData = [
      // Coffee Items (20)
      { name: 'Espresso Single', price: 15000, cat: 'coffee' },
      { name: 'Americano Hot', price: 22000, cat: 'coffee' },
      { name: 'Caffe Latte', price: 28000, cat: 'coffee' },
      { name: 'Cappuccino Hot', price: 30000, cat: 'coffee' },
      { name: 'Caramel Macchiato', price: 38000, cat: 'coffee' },
      { name: 'Vanilla Latte', price: 32000, cat: 'coffee' },
      { name: 'Kopi Susu Gula Aren', price: 25000, cat: 'coffee' },
      { name: 'Flat White', price: 30000, cat: 'coffee' },
      { name: 'Mocha Latte', price: 35000, cat: 'coffee' },
      { name: 'V60 Gayo', price: 35000, cat: 'coffee' },
      { name: 'Vietnam Drip', price: 25000, cat: 'coffee' },
      { name: 'Cold Brew Original', price: 30000, cat: 'coffee' },
      { name: 'Iced Black Coffee', price: 20000, cat: 'coffee' },
      { name: 'Affogato', price: 28000, cat: 'coffee' },
      { name: 'Irish Coffee', price: 40000, cat: 'coffee' },
      { name: 'Cortado', price: 25000, cat: 'coffee' },
      { name: 'Hazelnut Latte', price: 32000, cat: 'coffee' },
      { name: 'Dirty Chai', price: 38000, cat: 'coffee' },
      { name: 'Double Espresso', price: 20000, cat: 'coffee' },
      { name: 'Iced Coffee Milk', price: 25000, cat: 'coffee' },

      // Non-Coffee Items (15)
      { name: 'Matcha Latte', price: 32000, cat: 'nonCoffee' },
      { name: 'Chocolate Signature', price: 35000, cat: 'nonCoffee' },
      { name: 'Red Velvet Latte', price: 32000, cat: 'nonCoffee' },
      { name: 'Taro Latte', price: 32000, cat: 'nonCoffee' },
      { name: 'Thai Tea Iced', price: 24000, cat: 'nonCoffee' },
      { name: 'Lemon Tea', price: 18000, cat: 'nonCoffee' },
      { name: 'Lychee Tea', price: 26000, cat: 'nonCoffee' },
      { name: 'Strawberry Mojito', price: 30000, cat: 'nonCoffee' },
      { name: 'Blueberry Smoothie', price: 38000, cat: 'nonCoffee' },
      { name: 'Earl Grey Tea', price: 22000, cat: 'nonCoffee' },
      { name: 'Cookies & Cream', price: 38000, cat: 'nonCoffee' },
      { name: 'Avocado Juice', price: 25000, cat: 'nonCoffee' },
      { name: 'Fresh Milk', price: 15000, cat: 'nonCoffee' },
      { name: 'Chamomile Tea', price: 22000, cat: 'nonCoffee' },
      { name: 'Mineral Water', price: 10000, cat: 'nonCoffee' },

      // Food Items (15)
      { name: 'Croissant Butter', price: 25000, cat: 'food' },
      { name: 'Chocolate Muffin', price: 22000, cat: 'food' },
      { name: 'Beef Pastry', price: 28000, cat: 'food' },
      { name: 'French Fries', price: 25000, cat: 'food' },
      { name: 'Chicken Wings', price: 35000, cat: 'food' },
      { name: 'Roti Bakar Coklat', price: 25000, cat: 'food' },
      { name: 'Singkong Goreng', price: 20000, cat: 'food' },
      { name: 'Pisang Bakar Keju', price: 25000, cat: 'food' },
      { name: 'Club Sandwich', price: 45000, cat: 'food' },
      { name: 'Beef Burger', price: 50000, cat: 'food' },
      { name: 'Spaghetti Aglio Olio', price: 42000, cat: 'food' },
      { name: 'Nasi Goreng Jaya', price: 38000, cat: 'food' },
      { name: 'Fudge Brownie', price: 20000, cat: 'food' },
      { name: 'Cheese Cake Slice', price: 35000, cat: 'food' },
      { name: 'Donut Glazed', price: 12000, cat: 'food' },
    ];

    for (let i = 0; i < productData.length; i++) {
      const p = productData[i];
      let imgs = coffeeImages;
      if (p.cat === 'nonCoffee') imgs = nonCoffeeImages;
      if (p.cat === 'food') imgs = foodImages;

      const product = await Product.create({
        name: p.name,
        description: `Nikmati ${p.name} terbaik dari Toko Kopi Jaya.`,
        price: p.price,
        imageUrl: imgs[i % imgs.length],
        stock: 100,
        isAvailable: true
      });

      const targetCats = [categories[p.cat].id];
      if (Math.random() > 0.7) targetCats.push(categories.baru.id);
      if (Math.random() > 0.6) targetCats.push(categories.popular.id);
      
      await product.addCategories(targetCats);
    }

    // 5. Seed Admin User (Optional, for dashboard access)
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash('123456', salt);
    await User.create({
      name: 'Admin Jaya',
      phone: '0811111111',
      password: hashedPin,
      role: 'admin'
    });
    console.log('✅ Admin user seeded (Phone: 0811111111, PIN: 123456)');

    console.log('✅ 50 Products seeded successfully (Coffee, Non-Coffee, Food).');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
