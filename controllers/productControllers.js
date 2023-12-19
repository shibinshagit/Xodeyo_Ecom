const Products = require('../models/productModel');
const Categories = require('../models/categoryModel');
const sharp = require('sharp')
const path = require("path");
const fs = require('fs');



// loadProducts===================================================================================================================

const loadProducts = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const perPage = 3;
    const status = req.query.status;


    const filter = {
      $or: [
        { name: { $regex: new RegExp(search, 'i') } },
        { category: { $regex: new RegExp(search, 'i') } },
      ],
    };

    if (status === "blocked") {
      filter.list = false;
    } else if (status === "unblocked") {
      filter.list = true;
    } else if (status === "instock") {
      filter.quantity = { $gt: 0 };
    } else if (status === "outofstock") {
      filter.quantity = 0;
    } else {

    } 

    const totalProducts = await Products.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);
 
    const productsData = await Products.find()
      .skip((page - 1) * perPage)
      .limit(perPage);
 
    res.render('productLists', { products: productsData,totalPages, currentPage: page });
  } catch (error) {
    console.log(error.message);
  }
} 
// addProducts===========================================================================================================================
const addProducts = async(req,res) => {
    try{
    const categories = await Categories.find({})
       res.render('addProducts',{Categories : categories});
    }
    catch(error){
        console.error(error)
    }
}  

// insertProduct=============================================================================================================================  
  const insertProduct = async (req, res) => {
    try {
      const categories = await Categories.find({});
      const existingProduct = await Products.findOne({ productName: req.body.productName });
  
      if (existingProduct) {
        return res.render('addProducts', { message: 'Product already exists',Categories: categories});
      }
  
      const newProduct = {
        productName: req.body.productName,
        productCategory: req.body.productCategory,
        price: req.body.price,
        discountRate: req.body.discountRate,
        stock: req.body.stock,
        productDescription: req.body.productDescription,
        status: req.body.status,
        resellersPrice: req.body.resellersPrice,
      };
  
      if (req.files) {
        newProduct.images = await processProductImages(req.files);
  
        const savedProduct = await new Products(newProduct).save();
  
        return res.render('addProducts', { message: 'Product Added successfully',Categories: categories,});
      }
  
  
    } catch (error) {
      const categories = await Categories.find({});
      console.error(error.message);
      res.render('addProducts', { message: error.message, Categories: categories });
    }
  };
  
  const processProductImages = async (files) => {
    const processedImages = [];
  
    for (let i = 1; i <= 4; i++) {
      const fieldName = `image${i}`;
  
      if (files[fieldName]) {
        const file = files[fieldName][0];
        const image = sharp(file.path);

        const targetSize = { width: 679, height: 679 };
        
        image.resize(targetSize.width, targetSize.height, { fit: 'cover' });
        

  
        const tempFilename = `${file.filename.replace(/\.\w+$/, '')}_${Date.now()}.jpg`;
        const resizedImagePath = path.join(__dirname, '../public/assets/imgs/productImages', tempFilename);
  
        await image.toFile(resizedImagePath);
        processedImages.push(tempFilename);
      }
    }
  
    return processedImages;
  };
  
// unlistProduct============================================================================================================================= 

const unlistProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const products = await Products.findById(id);

    if (products) {
      products.isListed = !products.isListed;
      await products.save();
      res.redirect('/admin/productlist');
    } else {
      res.status(404).json({ error: 'product not found' });
    }
  } catch (error) {
    console.error(`Error in unlistProduct: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// editProduct============================================================================================================================= 

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const products = await Products.findById(id);
    const categories = await Categories.find({});

    if (products) {
     
      res.render('editProduct',{products:products,Categories: categories});
    } else {
      res.status(404).json({ error: 'product not found' });
    }
  } catch (error) {
    console.error(`Error in unlistProduct: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// updateProduct============================================================================================================================= 
const updateProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const categories = await Categories.find({});
    const existingProduct = await Products.findById(id);

    if (!existingProduct) {
      console.log('here 1')
      return res.render('editProduct',{ products: existingProduct, Categories: categories });
    }

    // Delete old image files


    existingProduct.productName = req.body.productName || existingProduct.productName;
    existingProduct.productCategory = req.body.productCategory || existingProduct.productCategory;
    existingProduct.price = req.body.price || existingProduct.price;
    existingProduct.discountRate = req.body.discountRate || existingProduct.discountRate;
    existingProduct.stock = req.body.stock || existingProduct.stock;
    existingProduct.productDescription = req.body.productDescription || existingProduct.productDescription;
    existingProduct.status = req.body.status || existingProduct.status;
    existingProduct.resellersPrice = req.body.resellersPrice || existingProduct.resellersPrice;

    if (req.files) {
      if (existingProduct.images && existingProduct.images.length > 0) {
        for (const oldImage of existingProduct.images) {
          const oldImagePath = path.join(__dirname, '../public/assets/imgs/productImages', oldImage);
        
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          } else {
            console.warn(`File not found: ${oldImagePath}`);
          }
        }
      }
      existingProduct.images = await processUpdateProductImages(req.files);
    }

    await existingProduct.save();

   
    return res.redirect('/admin/productlist');
  } catch (error) {
    const id = req.query.id;
    const existingProduct = await Products.findById(id);
    const categories = await Categories.find({});
    console.error(error.message);
    console.log('here 3')
    res.render('editProduct', { message: error.message, products: existingProduct, Categories: categories });
  }
};


const processUpdateProductImages = async (files) => {
  const processedImages = [];

  for (let i = 1; i <= 4; i++) {
    const fieldName = `image${i}`;

    if (files[fieldName]) {
      const file = files[fieldName][0];
      const image = sharp(file.path);

      const targetSize = { width: 679, height: 679 };
      
      image.resize(targetSize.width, targetSize.height, { fit: 'cover' });
      


      const tempFilename = `${file.filename.replace(/\.\w+$/, '')}_${Date.now()}.jpg`;
      const resizedImagePath = path.join(__dirname, '../public/assets/imgs/productImages', tempFilename);

      await image.toFile(resizedImagePath);
      processedImages.push(tempFilename);
      
    }
  }

  return processedImages;
};

// dltProduct============================================================================================================================= 

const dltProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const products = await Products.findOneAndDeleteById(id);
    if (products) {
     
      res.redirect('/productlist')
    } else {
      console.log('unable to delete products')
      
    }
  } catch (error) {
    console.error(`Error in dltProduct: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};
module.exports = {loadProducts,addProducts,insertProduct,unlistProduct,editProduct,updateProduct,dltProduct};