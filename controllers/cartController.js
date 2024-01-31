const Cart = require('../models/cartModel'); 
const Wishlist=require('../models/wishlistModel')
const session = require('express-session');




const addtoCart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.query.id;
        const qty = req.query.qty;

        const existingCart = await Cart.findOne({ user: userId });

        if (existingCart) {
            const existingCartItem = existingCart.items.find(item => item.product.toString() === productId);

            if (existingCartItem) {
                existingCartItem.quantity += parseInt(qty);
            } else {
                existingCart.items.push({ product: productId, quantity: parseInt(qty) });
            }

            existingCart.total = existingCart.items.reduce((total, item) => total + (item.quantity || 0), 0);

            await existingCart.save();

            const userWishlist = await Wishlist.findOne({ user: userId });
            if (userWishlist) {
                const wishlistItemIndex = userWishlist.items.findIndex(item => item.product.toString() === productId);
                if (wishlistItemIndex !== -1) {
                    userWishlist.items.splice(wishlistItemIndex, 1);
                    await userWishlist.save();
                }
            }
            const userWishlistLength = await Wishlist.findOne({ user: req.session.user_id }).populate('items.product');
            const wishlist = userWishlistLength ? userWishlistLength.items : [];
            req.session.wishlistItems = wishlist.length;

           return res.status(200).json({ success: true, message: 'Qty increased to one!' });
        } else {
            const newCartItem = { product: productId, quantity: parseInt(qty) };

            const newCart = new Cart({
                user: userId,
                items: [newCartItem],
                total: parseInt(qty, 10),
            });

            await newCart.save();
            req.session.cartLength = newCart.items.length; 
            const userWishlist = await Wishlist.findOne({ user: userId });
            if (userWishlist) {
                const wishlistItemIndex = userWishlist.items.findIndex(item => item.product.toString() === productId);
                if (wishlistItemIndex !== -1) {
                    userWishlist.items.splice(wishlistItemIndex, 1);
                    await userWishlist.save();
                }
            }


           return res.status(200).json({ success: true, message: 'Product added to cart successfully' });
       
        }

      
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ success: false, message: 'Failed to add product to cart' });
    }
};


//calculateSubtotal==========================================
  
const calculateSubtotal = (cart) => {
    let subtotal = 0;
    for (const cartItem of cart) {

        const isDiscounted = cartItem.product.discountStatus &&
            new Date(cartItem.product.startDate) <= new Date() &&
            new Date(cartItem.product.endDate) >= new Date();

        const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;

        subtotal += priceToConsider * cartItem.quantity;
    }
    return subtotal;
};

//=====================================================================================================================================//
//fucntion to calcualte product price
const calculateProductTotal = (cart) => {
    const productTotals = [];
    for (const cartItem of cart) {

        const isDiscounted = cartItem.product.discountStatus &&
            new Date(cartItem.product.startDate) <= new Date() &&
            new Date(cartItem.product.endDate) >= new Date();

        const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;

        const total = priceToConsider * cartItem.quantity;
        productTotals.push(total);
    }
    return productTotals;
};

//=====================================================================================================================================//











//To load the cart
const loadCart = async (req, res) => {
    const userId = req.session.user_id;

    try {
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');

        const cart = userCart ? userCart.items : []; 
        const subtotal = calculateSubtotal(cart);
        const productotal = calculateProductTotal(cart);
        const subtotalWithShipping = subtotal + 100
      
        req.session.cartItem = cart.length;
        let outOfStockError =false;

        if (cart.length > 0) {
            for (const cartItem of cart) {
                const product = cartItem.product;
        
                if (product.quantity<cartItem.quantity) {
                    outOfStockError = true;
                    break;
                }
            }
        }
        let maxQuantityErr = false;
        if (cart.length > 0) {
            for (const cartItem of cart) {
                const product = cartItem.product;
        
                if (cartItem.quantity > 2) {
                    maxQuantityErr = true;
                    break;
                }
            }
        }


        res.render('cart', {message:'cart loaded', user: req.session.user,cart,subtotal,outOfStockError,maxQuantityErr,productotal,subtotalWithShipping});
    } catch (err) {
        console.error('Error fetching user cart:', err);
     
    }
};
// =========================================================================================================================
const deleteCart = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const productId = req.query.id;
  
      const existingCart = await Cart.findOne({ user: userId });
      if (existingCart) {
        
        const updatedItems =await existingCart.items.filter(
          (item) => item.product.toString() !== productId
        );
  
        existingCart.items = updatedItems;
        existingCart.total =await updatedItems.reduce(
          (total, item) => total + (item.quantity || 0),
          0
        );
  
        await existingCart.save();
  
        res.json({ success: true, toaster: true });
      } else {
        res.json({ success: false, error: "Cart not found" });
      }
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.json({ success: false, error: "Internal server error" });
    }
  };


module.exports = {
    loadCart,addtoCart,deleteCart
}


