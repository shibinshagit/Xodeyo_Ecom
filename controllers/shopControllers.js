const Products = require('../models/productModel');
const Categories = require('../models/categoryModel');


// --------------loadShop-----------------------------------------------------------------------------------------------
const loadShop = async(req,res) =>{

try{
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
 
    res.render('shop', { products: productsData,totalProducts:totalProducts,totalPages, currentPage: page });


}catch(error){
    console.error(error)
}


}

const showProducts =async(req,res) => {
  try{

   const id = req.query.id
productData = await Products.findById({_id : id})

   if(id){
    res.render('showProducts',{productdata:productData})
   }




  }catch(error){
    console.error(error)
  }
}



module.exports = {loadShop,showProducts}