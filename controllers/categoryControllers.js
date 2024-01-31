const fs = require('fs');
const path = require('path');
const Categories = require('../models/categoryModel');
const Product = require('../models/productModel');




// loadCategories---------------------------------------------------------------------------
const loadCategories =  async (req, res) => {
    try {
      var search = "";
      var isListed = req.query.listed;
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 5;
  
      if (req.query.search) {
        search = req.query.search;
      }
      const filter = {
        $or: [
          { category: { $regex: '.*' + search + '.*', $options: 'i' } },
          { description: { $regex: '.*' + search + '.*', $options: 'i' } },
      ],
      };
      
  
      if (isListed === "true") {
        filter.isListed = true;
      } else if (isListed === "false") {
        filter.isListed = false;
      } else {
      }
  
      const totalCategories = await Categories.countDocuments(filter);
      const totalPages = Math.ceil(totalCategories / perPage);
      const categoryData = await Categories.find(filter)
      .sort({ createdDate: -1 }) // Sort in descending order based on createdAt
      .skip((page - 1) * perPage)
      .limit(perPage);
  
      res.render('categoryList', { categories: categoryData,totalPages, currentPage: page ,totalCategories});
    } catch (error) {
      console.log(error.message);
    }
  } 
  

// createcategories---------------------------------------------------------------------------------------------------------------------------------------

const createCategories = async (req, res) => res.render('createCategories')

  
// addCategories-------------------------------------------------------------------------------------------------------------------------------------------------------------
const insertCategories = async (req, res) => {
  try {
    const categoryName = req.body.category;
    const categoryExist = await Categories.findOne({ category: { $regex: new RegExp(`^${categoryName}$`, 'i') } });

    if (categoryExist) {
      return res.render('createCategories', { message: 'Category name already exists!' });
    }

    const categoryData = await new Categories({
      category: categoryName,
      description: req.body.description,
      image: req.file.filename,
      isListed: true, 
    }).save();

    if (categoryData) {
      res.render('createCategories', { message: 'Category registration successful' });
    } else {
      res.render('createCategories', { message: 'Category registration failed' });
    }
  } catch (error) {
    console.error(`Error in insertCategories: ${error.message}`);
    res.render('createCategories', { message: 'Failed to create category' });
  }
};
// unlistCategory------------------------------------------------------------------------------------------------------------------------------
const unlistCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Categories.findById(id);
    const products = await Product.find({productCategory :category.category});
  

    if (category) {
      category.isListed = !category.isListed;
      await category.save();
      for (const product of products) {
        product.isListed = !product.isListed;
        await product.save();
      }
      res.redirect('/admin/category');
    } else {
      res.status(404).json({ error: 'Category not found' });
    }
  } catch (error) {
    console.error(`Error in unlistCategory: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// dltCategories------------------------------------------------------------------------------------------------------------------------------
const dltCategories = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryname = await Categories.findById(id)
    const products = await Product.find({productCategory :categoryname.category});
    const category = await Categories.findByIdAndDelete(id);
   
    if (category) {
      products.isListed = false;
      const imagePath = path.join(__dirname, '../public/assets/imgs/categoryImages', category.image);
      fs.unlinkSync(imagePath);
      res.redirect('/admin/category');
    } else {
      res.status(404).json({ error: 'Category not found' });
    }
  } catch (error) {
    console.error(`Error in unlistCategory: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
    loadCategories,createCategories,insertCategories,unlistCategory,dltCategories
}