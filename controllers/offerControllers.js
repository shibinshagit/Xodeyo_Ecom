const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Offer = require('../models/offerModel')

// listOffers=============================================================================================================

const listOffers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let query = {};
        const limit = 7;
        const totalCount = await Offer.countDocuments(query);

        const totalPages = Math.ceil(totalCount / limit);
        if (req.query.discountOn) {
            if (req.query.discountOn === "product") {
                query.discountOn = "product";
            } else if (req.query.discountOn === "category") {
                query.discountOn = "category";
            }
        }
        const offer = await Offer.find(query)
            .populate("discountedProduct")
            .populate("discountedCategory")
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ startDate: -1 });
        res.render("listOffers", {
            offer,
            totalPages,
            currentPage: page,totalCount
        });
    } catch (error) {
        console.log(error.message);
    }
};

// createOffer============================================================================================================

const createOffer = async (req, res) => {
    try {
        const product = await Product.find().sort({ date: -1 });
        const category = await Category.find().sort({ date: -1 });
        res.render("createOffer", { product, category });
    } catch (error) {
        console.log(error.message);
    }
};

// insertOffer=================================================================================================================

const insertOffer = async (req, res) => {
    try {
        const product = await Product.find({});
        const categoryData = await Category.find({});

        const {
            name,
            discountOn,
            discountType,
            discountValue,
            maxRedeemableAmt,
            startDate,
            endDate,
            discountedProduct,
            discountedCategory,
        } = req.body;

        const existingNameOffer = await Offer.findOne({ name });
        const existingCategoryOffer = await Offer.findOne({ discountedCategory });
        const existingProductOffer = await Offer.findOne({ discountedProduct });

        if (existingNameOffer) {
            return res.render("createOffer", {
                product,
                category: categoryData,
                message: "Duplicate Discount Name not allowed.",
            });
        }

        if (discountedCategory && existingCategoryOffer) {
            return res.render("createOffer", {
                product,
                category: categoryData,
                message: "An offer for this category already exists.",
            });
        }

        if (discountedProduct && existingProductOffer) {
            return res.render("createOffer", {
                product,
                category: categoryData,
                message: "An offer for this product already exists.",
            });
        }

        const newOffer = new Offer({
            name,
            discountOn,
            discountType,
            discountValue,
            maxRedeemableAmt,
            startDate,
            endDate,
            discountedProduct,
            discountedCategory,
        });
        await newOffer.save();

        if (discountedProduct) {
            const discountedProductData = await Product.findById(discountedProduct);

            let discount = 0;
            if (discountType === "percentage") {
                discount = (discountedProductData.price * discountValue) / 100;
            } else if (discountType === "fixed Amount") {
                discount = discountValue;
            }
            await Product.updateOne(
                { _id: discountedProduct },
                {
                    $set: {
                        discountPrice: calculateDiscountPrice(
                            discountedProductData.price,
                            discountType,
                            discountValue
                        ),
                        discount,
                        discountStart: startDate,
                        discountEnd: endDate,
                        discountStatus: true,
                    },
                }
            );
        } else if (discountedCategory) {
            const categoryData = await Category.findById(discountedCategory);

            await Category.updateOne(
                { _id: discountedCategory },
                {
                    $set: {
                        discountType,
                        discountValue,
                        discountStart: startDate,
                        discountEnd: endDate,
                        discountStatus: true,
                    },
                }
            );

            const discountedProductData = await Product.find({
                category: categoryData.category,
            });

            for (const product of discountedProductData) {
                let discount = 0;
                if (discountType === "percentage") {
                    discount = (product.price * discountValue) / 100;
                } else if (discountType === "fixed Amount") {
                    discount = discountValue;
                }
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            discountPrice: calculateDiscountPrice(
                                product.price,
                                discountType,
                                discountValue
                            ),
                            discount,
                            discountStart: startDate,
                            discountEnd: endDate,
                            discountStatus: true,
                        },
                    }
                );
            }
        }

        res.redirect("/admin/offers");
    } catch (error) {
        console.error(error.message);
    }
};

// ? for caluculating the discount price
function calculateDiscountPrice(originalPrice, discountType, discountValue) {
    if (discountType === "fixed Amount") {
        return originalPrice - discountValue;
    } else if (discountType === "percentage") {
        const discountAmount = (originalPrice * discountValue) / 100;
        return originalPrice - discountAmount;
    } else {
        throw new Error("Invalid discount type");
    }
}

// unlistOffer===========================================================================================================

const unlistOffer = async (req, res) => {
    try {
      const id = req.query.id;
      console.log(id);
      const offer = await Offer.findById(id);
      if (offer) {
        offer.isActive = !offer.isActive;
        await offer.save();
        res.json({ success: true});
      } else {
        res.json({ success: false});
      }
    } catch (error) {
      console.error(`Error in unlist Banner: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  };







module.exports = {
    listOffers,createOffer,insertOffer,unlistOffer
}