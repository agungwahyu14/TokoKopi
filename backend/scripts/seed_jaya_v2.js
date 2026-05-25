require('dotenv').config();
const { 
  sequelize, Category, Product 
} = require('../models');

const seedJaya = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected for seeding Jaya V2.');

    // sync({ force: true }) will drop existing tables and recreate them with the new schema
    await sequelize.sync({ force: true });
    console.log('✅ Database schema updated and cleared.');

    // Step 1: Inisialisasi Kategori Utama (Parent)
    const minuman = await Category.create({ id: 1, name: 'Minuman' });
    const makanan = await Category.create({ id: 2, name: 'Makanan' });
    console.log('✅ Step 1: Parent categories created.');

    // Step 2: Pembuatan Sub-Kategori (Children)
    const subCategories = await Category.bulkCreate([
      { name: 'Espresso Based', parentId: minuman.id },
      { name: 'Manual Brew', parentId: minuman.id },
      { name: 'Non-Coffee', parentId: minuman.id },
      { name: 'Signature Drink', parentId: minuman.id },
      { name: 'Dessert', parentId: makanan.id },
      { name: 'Pastry', parentId: makanan.id },
      { name: 'Heavy Meal', parentId: makanan.id }
    ]);
    console.log('✅ Step 2: Sub-categories created.');

    // Step 3: Definisi Kategori Virtual (Labels)
    const labels = await Category.bulkCreate([
      { name: 'Popular' },
      { name: 'Most Liked' },
      { name: 'Recommended' }
    ]);
    console.log('✅ Step 3: Label categories created.');

    // Fetch all categories for associations
    const allCats = await Category.findAll();
    const catMap = {};
    allCats.forEach(c => catMap[c.name] = c);

    // Step 4: Generasi 50 Produk Unik
    const products = [];
    
    // Distribution: 60% Drinks (30), 40% Food (20)
    const drinkSubCats = ['Espresso Based', 'Manual Brew', 'Non-Coffee', 'Signature Drink'];
    const foodSubCats = ['Dessert', 'Pastry', 'Heavy Meal'];

    const adjectives = ['Special', 'Premium', 'Signature', 'Deluxe', 'Classic', 'Authentic', 'Modern', 'Spicy', 'Sweet', 'Fresh'];
    const drinkNouns = ['Latte', 'Cappuccino', 'Americano', 'Matcha', 'Chocolate', 'Smoothie', 'Tea', 'Mocha', 'Espresso', 'Cold Brew'];
    const foodNouns = ['Croissant', 'Cake', 'Pasta', 'Rice Bowl', 'Sandwich', 'Waffle', 'Toast', 'Burger', 'Steak', 'Salad'];

    for (let i = 1; i <= 50; i++) {
      const isDrink = i <= 30; // 60% of 50 = 30
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = isDrink ? drinkNouns[Math.floor(Math.random() * drinkNouns.length)] : foodNouns[Math.floor(Math.random() * foodNouns.length)];
      
      const name = `${adj} ${noun} #${i}`;
      const description = `Nikmati cita rasa istimewa dari ${name}. Dibuat dengan bahan-bahan berkualitas tinggi dan resep rahasia Toko Kopi Jaya.`;
      const price = Math.floor(Math.random() * (55000 - 15000 + 1)) + 15000;
      const imageUrl = `https://images.unsplash.com/photo-${1500 + Math.floor(Math.random() * 500)}?q=80&w=500&auto=format&fit=crop`;

      const product = await Product.create({
        name,
        description,
        price,
        imageUrl,
        stock: Math.floor(Math.random() * 100) + 10,
        isAvailable: true
      });

      // Step 5: Logika Distribusi Data & Many-to-Many Relation
      const assignedCats = [];
      
      // Every product belongs to its parent category
      assignedCats.push(isDrink ? catMap['Minuman'] : catMap['Makanan']);

      // Every product belongs to one random sub-category
      const subCatName = isDrink ? drinkSubCats[Math.floor(Math.random() * drinkSubCats.length)] : foodSubCats[Math.floor(Math.random() * foodSubCats.length)];
      assignedCats.push(catMap[subCatName]);

      // Handle labels: 10 Popular, 10 Most Liked
      // Let's use indices to track
      if (i <= 10) {
        assignedCats.push(catMap['Popular']);
      } else if (i > 10 && i <= 20) {
        assignedCats.push(catMap['Most Liked']);
      }
      
      // Randomly assign Recommended to some others
      if (i > 20 && Math.random() > 0.7) {
        assignedCats.push(catMap['Recommended']);
      }

      await product.addCategories(assignedCats);
    }

    console.log('✅ Step 4 & 5: 50 unique products generated and distributed.');
    console.log('🎉 SEEDING TOKO KOPI JAYA V2 COMPLETED!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Jaya V2:', error);
    process.exit(1);
  }
};

seedJaya();
