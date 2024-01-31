const Products = require('../models/productModel');
const Categories = require('../models/categoryModel');


const loadShop = async (req, res) => {
    try {
        const search = req.query.search || ''
        const page = parseInt(req.query.page) || 1;
        const perPage = 50;
        const status = req.query.status || ''
        const category = req.query.category;

        const filter = {};
      
          if (search) {
            
         
            filter.$or = [
                { productName : { $regex: new RegExp(search, 'i') } },
                { productCategory: { $regex: new RegExp(search, 'i') } },
                { productDescription: { $regex: new RegExp(search, 'i') } },
            ];
        }
        

        if(category){
        filter.productCategory= category
        }


        
        // Extract the price range from the request (assuming the request contains "min" and "max" parameters)
        const minPrice = parseInt(req.query.min) || 199;
        const maxPrice = parseInt(req.query.max) || 1999;
        const sortOrder = parseInt(req.query.sortOrder) || 1;
       
        
        // Add price range condition if provided
        filter.discountRate = { $gte: minPrice, $lte: maxPrice };

        // Add category condition if provided
        if (status === "blocked") {
            filter.list = false;
        } else if (status === "unblocked") {
            filter.list = true;
        } else if (status === "instock") {
            filter.quantity = { $gt: 0 };
        } else if (status === "outofstock") {
            filter.quantity = 0;
        }

     

        const totalProducts = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / perPage);
        const categories = await Categories.find();
        const productsData = await Products.find(filter)
            .skip((page - 1) * perPage)
            .sort({ discountRate: sortOrder,createdAt: -1 })
            .limit(perPage);
  
        res.render('shop', {
            products: productsData,
            totalProducts: totalProducts,
            totalPages,
            currentPage: page,
            categories: categories,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};




  

// ----showProducts-----------------------------------------------------------------------------------------------------------------------------
const showProducts =async(req,res) => {
  try{

   const id = req.query.id
   const page = parseInt(req.query.page) || 2;
   const perPage = parseInt(req.query.perPage) || 4;

const productData = await Products.findById({_id : id})
const products = await Products.find().sort({ createdAt: -1, })
                               .limit(perPage*page);

   
    res.render('showProducts',{message:'',productdata:productData,products})
    
  }catch(error){
    console.error(error)
  }
}



module.exports = {loadShop,showProducts}