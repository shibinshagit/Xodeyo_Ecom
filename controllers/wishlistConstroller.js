const Cart = require ('../models/cartModel')
const Wishlist = require ('../models/wishlistModel')

// ======dltwishitem=========================================================================================================================================
const dltWishitem = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const productId = req.query.id;

      const existingWhishlist = await Wishlist.findOne({ user: userId });
      if (existingWhishlist) {
        
        const updatedItems =await existingWhishlist.items.filter(
          (item) => item.product.toString() !== productId
        );
  
        existingWhishlist.items = updatedItems;
        existingWhishlist.total =await updatedItems.reduce(
          (total, item) => total + (item.quantity || 0),
          0
        );
  
        await existingWhishlist.save();
  
        res.json({ success: true, toaster: true });
      } else {
        res.json({ success: false, error: "Whishlist not found" });
      }
    } catch (error) {
      console.error("Error removing Whishlist item:", error);
      res.json({ success: false, error: "Internal server error" });
    }
  };








// ======addtoWishlist=========================================================================================================================================
const addtoWishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.query.id;
       

        let userWishlist = await Wishlist.findOne({ user: userId });

        if (!userWishlist) {
            userWishlist = new Wishlist({
                user: userId,
                items: [{ product: productId }],
            });
            await userWishlist.save();

            const userWishlistUpdate = await Wishlist.findOne({ user: req.session.user_id }).populate('items.product');
            const wishlistUpdate = userWishlistUpdate ? userWishlistUpdate.items : [];
            req.session.wishlistItems = wishlistUpdate.length;

            res.status(200).json({ success: true, message: 'Product added to wishlist' });
        } else {
            const existingWishlistItem = await userWishlist.items.find((item) => item.product.toString() === productId);

            if (existingWishlistItem) {
                return res.status(200).json({ success: false, message: 'Product already in wishlist' });
            } else {
                // Add the new item to the wishlist
                userWishlist.items.push({ product: productId });
                await userWishlist.save();

                const userWishlistUpdate = await Wishlist.findOne({ user: req.session.user_id }).populate('items.product');
                const wishlistUpdate = userWishlistUpdate ? userWishlistUpdate.items : [];
                req.session.wishlistItems = wishlistUpdate.length;

                res.status(200).json({ success: true, message: 'Product added to wishlist' });
            }
        }
    } catch (error) {
        console.error('Error adding product to wishlist:', error);
        res.status(500).json({ success: false, message: 'Failed to add product to wishlist' });
    }
};

// ===load wishlist============================================================================================================================

const loadWishlist = async (req, res) => {
    req.session.lastGetRequest = req.originalUrl;
    const userId = req.session.user_id;

    try {
        const userWishlist = await Wishlist.findOne({ user: userId }).populate('items.product');

        const wishlist = userWishlist ? userWishlist.items : [];
      
        res.render('wishlist', { user: req.session.user, wishlist });
    } catch (err) {
        console.error('Error fetching user wishlist:', err);

    }
};



 







module.exports = {
    loadWishlist,addtoWishlist,dltWishitem
}