require('dotenv').config();
const bcrypt = require('bcryptjs');
const { 
  sequelize, User, Product, Order, OrderItem, Category, Store, Promo 
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 1. Create Categories
    const categories = {
      coffee: await Category.create({ name: 'Coffee' }),
      nonCoffee: await Category.create({ name: 'Non-Coffee' }),
      food: await Category.create({ name: 'Food' }),
      promo: await Category.create({ name: 'Promo & Combo' }),
      baru: await Category.create({ name: 'Baru' }),
      popular: await Category.create({ name: 'Popular' })
    };
    console.log('✅ Categories seeded.');

    // 2. Seed Stores (Bali focus)
    const stores = await Store.bulkCreate([
      {
        name: "Toko Kopi Jaya Denpasar",
        address: "Jl. Teuku Umar No. 123, Denpasar",
        city: "Denpasar",
        phone: "0361-123456",
        operatingHours: "07:00 - 22:00",
        latitude: -8.6478,
        longitude: 115.2166,
        isActive: true,
      },
      {
        name: "Toko Kopi Jaya Kuta",
        address: "Jl. Pantai Kuta No. 45, Kuta",
        city: "Kuta",
        phone: "0361-654321",
        operatingHours: "08:00 - 23:00",
        latitude: -8.7190,
        longitude: 115.1700,
        isActive: true,
      },
      {
        name: "Toko Kopi Jaya Ubud",
        address: "Jl. Raya Ubud No. 88, Ubud",
        city: "Ubud",
        phone: "0361-987654",
        operatingHours: "08:00 - 21:00",
        latitude: -8.5069,
        longitude: 115.2625,
        isActive: true,
      }
    ]);
    console.log('✅ Stores seeded (Bali locations).');

    // 3. Seed Users (1 Admin, 15 Customers)
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@tokokopijaya.com',
      password: hashedPassword,
      role: 'admin',
      phone: '081122334455'
    }, { hooks: false });

    const customersData = [];
    for (let i = 1; i <= 15; i++) {
      customersData.push({
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        password: hashedPassword,
        role: 'customer',
        phone: `081234567${i.toString().padStart(3, '0')}`,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      });
    }
    const customers = await User.bulkCreate(customersData, { hooks: false });
    console.log('✅ Users (Admin + 15 Customers) seeded with PIN 123456.');

    // 4. Seed Promos
    const promos = await Promo.bulkCreate([
      { code: 'JAYABALI', title: 'Opening Bali', description: 'Potongan 30% all menu untuk outlet Bali.', type: 'percent', value: 30, imageUrl: coffeeImages[0] },
      { code: 'NGOPIHEMAT', title: 'Ngopi Hemat', description: 'Potongan Rp 10.000 minimal belanja Rp 50.000.', type: 'flat', value: 10000, imageUrl: coffeeImages[1] },
      { code: 'MEMBERBARU', title: 'Member Baru', description: 'Diskon 50% untuk transaksi pertama.', type: 'percent', value: 50, imageUrl: coffeeImages[2] }
    ]);
    console.log('✅ Promos seeded.');

    // 5. Seed Products (Total 50)
    const productList = [
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

    const products = [];
    for (let i = 0; i < productList.length; i++) {
      const p = productList[i];
      let imgs = coffeeImages;
      if (p.cat === 'nonCoffee') imgs = nonCoffeeImages;
      if (p.cat === 'food') imgs = foodImages;

      const product = await Product.create({
        name: p.name,
        description: `Nikmati ${p.name} terbaik dari Toko Kopi Jaya. Dibuat dengan bahan berkualitas tinggi untuk rasa yang autentik.`,
        price: p.price,
        imageUrl: imgs[i % imgs.length],
        stock: 50 + Math.floor(Math.random() * 50),
        isAvailable: true
      });

      const targetCats = [categories[p.cat].id];
      if (Math.random() > 0.7) targetCats.push(categories.baru.id);
      if (Math.random() > 0.6) targetCats.push(categories.popular.id);
      
      await product.addCategories(targetCats);
      products.push(product);
    }
    console.log('✅ Products (50 items) seeded with many-to-many categories.');

    // 6. Seed Orders (100 transactions)
    console.log('⏳ Seeding 100 Orders (this may take a few seconds)...');
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    const orderTypes = ['dine-in', 'takeaway'];
    const paymentMethods = ['QRIS', 'Cash', 'Bank Transfer', 'Credit Card'];

    for (let i = 0; i < 100; i++) {
      const daysAgo = Math.floor(Math.random() * 15); // Last 15 days
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(Math.floor(Math.random() * 14) + 8); 

      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const randomStore = stores[Math.floor(Math.random() * stores.length)];
      
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const orderItemsData = [];
      let subtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        const itemSubtotal = randomProduct.price * qty;
        subtotal += itemSubtotal;
        orderItemsData.push({
          productId: randomProduct.id,
          quantity: qty,
          unitPrice: randomProduct.price,
          subtotal: itemSubtotal
        });
      }

      const tax = subtotal * 0.1;
      const totalAmount = subtotal + tax;

      const order = await Order.create({
        userId: randomCustomer.id,
        storeId: randomStore.id,
        totalAmount,
        subtotal,
        tax,
        discount: 0,
        status: daysAgo === 0 ? statuses[Math.floor(Math.random() * 3)] : (Math.random() > 0.1 ? 'completed' : 'cancelled'),
        notes: Math.random() > 0.8 ? 'Less sugar please' : '',
        orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        createdAt: date,
        updatedAt: date
      });

      for (const item of orderItemsData) {
        await OrderItem.create({
          ...item,
          orderId: order.id
        });
      }
    }
    console.log('✅ Orders (100 transactions) seeded.');

    console.log('🎉 UNIFIED SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
