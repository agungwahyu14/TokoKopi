const { Category } = require('../models');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Category, as: 'children' }]
    });
    const response = {
      success: true,
      count: categories.length,
      data: categories,
    };
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const reorderCategories = async (req, res, next) => {
  try {
    const { newOrder } = req.body; // Array of IDs in new order
    
    if (!newOrder || !Array.isArray(newOrder)) {
      return res.status(400).json({ success: false, message: 'Invalid order data' });
    }

    // Update each category's sortOrder
    const promises = newOrder.map((id, index) => {
      return Category.update({ sortOrder: index }, { where: { id } });
    });

    await Promise.all(promises);

    return res.status(200).json({ success: true, message: 'Categories reordered successfully' });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    
    await category.update(req.body);
    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    
    await category.destroy();
    return res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, reorderCategories };