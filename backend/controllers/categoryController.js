const { Category } = require('../models');
const { NotFoundError } = require('../middleware/errorHandler');

class CategoryController {
  /**
   * Get all categories
   */
  static async getAll(req, res) {
    const { includeSubcategories } = req.query;

    const categories = includeSubcategories === 'true'
      ? await Category.findAll(true)
      : await Category.findAllWithCount();

    console.log(`✅ Found ${categories.length} categories`);

    res.json({
      success: true,
      categories
    });
  }

  /**
   * Get single category
   */
  static async getOne(req, res) {
    const { id } = req.params;

    let category;
    if (!isNaN(id)) {
      category = await Category.findById(parseInt(id));
    } else {
      category = await Category.findBySlug(id);
    }

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    res.json({
      success: true,
      category
    });
  }

  /**
   * Create category (admin only)
   */
  static async create(req, res) {
    const { name, description, icon } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const category = await Category.create({
      name,
      slug,
      description,
      icon
    });

    console.log(`✅ Created category: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  }

  /**
   * Update category (admin only)
   */
  static async update(req, res) {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const category = await Category.update(id, {
      name,
      slug,
      description,
      icon
    });

    console.log(`✅ Updated category: ${category.name}`);

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  }

  /**
   * Delete category (admin only)
   */
  static async delete(req, res) {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    await Category.delete(id);

    console.log(`✅ Deleted category: ${category.name}`);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  }
}

module.exports = CategoryController;