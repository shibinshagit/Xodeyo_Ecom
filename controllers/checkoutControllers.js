const Cart = require('../models/cartModel'); 
const User = require('../models/userModels'); 
const Address=require('../models/addressModel')
const Transaction = require("../models/transactionModels");
const Product = require("../models/productModel");
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const session = require('express-session');


require("dotenv").config();
const Razorpay = require("razorpay");


const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;


const razorpay = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY,
});





const calculateSubtotal = (cart) => {
  let subtotal = 0;
  for (const cartItem of cart) {
      const isDiscounted = cartItem.product.discountStatus &&
          new Date(cartItem.product.discountStart) <= new Date() &&
          new Date(cartItem.product.discountEnd) >= new Date();

      const priceToConsider = cartItem.product.discountRate;

      subtotal += priceToConsider * cartItem.quantity;
  }
  return subtotal;
};
//======loadcheckout===============================================================================================================================//

   const loadcheckout = async (req, res) => {
    try {
        const userId =  req.session.user_id
        const orders = await Cart.findOne({ user: userId }).populate('items.product')
        const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
        const productTotal = calculateSubtotal(orders.items);
        res.render('loadcheckout', { orders: orders.items, productTotal, addresses })
        
    } catch (error) {
        console.log(error.message)
    }
}
  

//======placeOrderCodWallet===============================================================================================================================//

const placeOrderCodWallet = async (req, res) => {
  const userId = req.session.user_id
  const { address, paymentMethod, couponCode} = req.body;
  console.log('there is coupon man'+couponCode)
  
  const payment = paymentMethod;
  try {
      const userData = await User.findById(userId);
      const cartData = await Cart.findOne({ user: userId })
          .populate({
              path: "items.product",
              model: "Product",
          })
          .populate("user");

      if (!userData || !cartData) {
          return res
              .status(500)
              .json({ success: false, error: "User or cart not found." });
      }

      const cartItems = cartData.items || [];
      let totalAmount = 0;

      for (const cartItem of cartItems) {
          const product = cartItem.product;

          if (!product) {
              return res
                  .status(500)
                  .json({ success: false, error: "Product not found.", userData });
          }

          if (product.stock < cartItem.quantity) {
              return res
                  .status(400)
                  .json({ success: false, error: "Product Out Of Stock", userData });
          }
          // const isDiscounted = product.discountStatus &&
          //     new Date(product.discountStart) <= new Date() &&
          //     new Date(product.discountEnd) >= new Date();

          // const priceToConsider = isDiscounted ? product.discountPrice : product.price;
          const priceToConsider = product.discountRate;

          product.stock -= cartItem.quantity;
          
          // const GST = (18 / 100) * totalAmount;

          const itemTotal = priceToConsider * cartItem.quantity;
          totalAmount += parseFloat(itemTotal.toFixed(2));

          await product.save();
      }
      if (req.session.discountrate) {
          totalAmount = req.session.discountrate + 100;
          console.log(totalAmount+'total mahn')
      } 
  
      const orderData = new Order({
          user: userId,
          address: address,
          orderDate: new Date(),
          status: "Pending",
          paymentMethod: payment,
          paymentStatus: "succesfull",
          deliveryDate: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000),
          totalAmount: totalAmount,
          items: cartItems.map(cartItem => {
              const product = cartItem.product;
              const isDiscounted = product.discountStatus &&
                  new Date(product.discountStart) <= new Date() &&
                  new Date(product.discountEnd) >= new Date();
              const priceToConsider = isDiscounted ? product.discountPrice : product.price;

              return {
                  product: product._id,
                  quantity: cartItem.quantity,
                  price: priceToConsider,
              };
          }),
      });

      await orderData.save();
      if (payment == "Cash On Delivery") {
        consol.log('45 oiuuuuuuuuuuu')
          const transactiondebit = new Transaction({
              user: userId,
              amount: totalAmount,
              type: "debit",
              paymentMethod: orderData.paymentMethod,
              orderId: orderData._id,
              description: `Paid Using COD`,
          });
          await transactiondebit.save();
      }
      if (payment === "Wallet") {
        console.log('55 oiuuuuuuuuuuu')
          if (totalAmount <= userData.walletBalance) {
              userData.walletBalance -= totalAmount;
              await userData.save();

              const transactiondebit = new Transaction({
                  user: userId,
                  amount: totalAmount,
                  type: "debit",
                  paymentMethod: orderData.paymentMethod,
                  orderId: orderData._id,
                  description: `Debited from wallet `,
              });
              await transactiondebit.save();
          } else {
              await Order.deleteOne({ _id: orderData._id });
              return res
                  .status(400)
                  .json({ success: false, error: "Insufficient Wallet Balance", userData });
          }
      }
      await Cart.deleteOne({ user: userId });

      const Data = await Order.findOne({ user: userId })
          .populate("user")
          .populate({
              path: "address",
              model: "Address",
          })
          .populate({
              path: "items.product",   
              model: "Product",
          })
          .sort({ orderDate: -1 });
      res
          .status(200)
          .json({ success: true, message: "Order placed successfully." });

    //   res.render("orderSuccess",{orderData:Data});
  } catch (error) {
      console.error("Error placing the order:", error);
  }
};

// invoice==============================================================================================

const invoice = async (req, res) => {
    try {console.log('1')
        const userId =  req.session.user_id
        console.log(userId)
        const orders = await Cart.findOne({ user: userId }).populate('items.product')
        console.log(orders)
        const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
        console.log(addresses)
        const productTotal = calculateSubtotal(orders.items);
        console.log(productTotal)
        res.render('loadcheckout', { orders: orders.items, productTotal, addresses })
    } catch (error) {
      console.log('0')
        console.log(error.message)
    }
}


// admin side functions-------------------------------------------------------------------------------------------------------------------------

const listOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let query = {};
        if (req.query.status) {
            if (req.query.status === "Pending") {
                query.status = "Pending";
            } else if (req.query.status === "Shipped") {
                query.status = "Shipped";
            } else if (req.query.status === "Out For Delivery") {
                query.status = "Out For Delivery";
            } else if (req.query.status === "Order Confirmed") {
                query.status = "Order Confirmed";
            } else if (req.query.status === "Out For Delivery") {
                query.status = "Out For Delivery";
            } else if (req.query.status === "Delivered") {
                query.status = "Delivered";
            } else if (req.query.status === "Return Requested") {
                query.status = "Return Requested";
            } else if (req.query.status === "Return Successfull") {
                query.status = "Return Successfull";
            } else if (req.query.status === "Cancelled") {
                query.status = "Cancelled";
            }
        }
        const limit = 7;
        const totalCount = await Order.countDocuments(query);

        const totalPages = Math.ceil(totalCount / limit);

        const Orders = await Order.find(query)
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ orderDate: -1 });
        res.render("listOrders", { orders: Orders, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
};



// buyNow====================================================================================================
// ==============================buyNow============================================================================

const buyNow = async (req, res) => {
    try {
        const userId =  req.session.user_id;
        const quantity = req.query.quantity;
        const orders = await Product.findOne({ user: userId })
        const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
        const productTotal = calculateSubtotal(orders.items);
        res.render('loadcheckout', { orders: orders.items, productTotal, addresses })
        
    } catch (error) {
        console.log(error.message)
    }
}
  
// show user side orderDetails============================================================================================================

const orderDetails = async (req, res) => {
    try {
        const orderId = req.query.id;
        const orderData = await Order.findOne({ _id: orderId })
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            });
        res.render("orderDetails", { orders: orderData });
    } catch (error) {
        console.log(error.message);
    }
};

// cancelOrder====================================================================================================================
const cancelOrder = async (req, res) => {
    try {
        const OrderStatus = req.query.status;
        const orderId = req.query.orderId;
        const Order = await Order.findById(orderId).populate({
            path: "items.product",
            model: "Product",
        });

        if (OrderStatus == 'Product Cancel') {
            const productId = req.query.productId
            for (const item of Order.items) {
                if (item.product._id == productId) {
                    item.status = "Cancel Requested"
                }
            }
            await Order.save();
            return res.redirect(`/userorderdetails?orderId=${orderId}`)
        }
        if (OrderStatus == "Cancelled") {
            for (const item of Order.items) {
                const productId = item.product._id;
                const orderedQuantity = item.quantity;
                const Product = await product.findById(productId);
                if (Order.paymentMethod == "Cash On Delivery") {
                    Order.paymentStatus = "Declined";
                } else {
                    Order.paymentStatus == "Refunded";
                }
                if (Product) {
                    Product.quantity += orderedQuantity;
                    await Product.save();
                }
            }
        }
        if (OrderStatus == "Delivered") {
            Order.deliveryDate = new Date();
            Order.paymentStatus = "Payment Successful";
        }

        Order.status = OrderStatus;
        if (req.query.reason) {
            Order.reason = req.query.reason;
        }
        await Order.save();

        if (req.query.orderDetails) {
            res.redirect(`/admin/orderdetails?orderId=${orderId}`);
        } else if (
            Order.status == "Return Requested" ||
            Order.status == "Cancel Requested"
        ) {
            res.redirect(`/userorderdetails?orderId=${orderId}`);
        } else {
            res.redirect("/admin/orderList");
        }
    } catch (error) {
        console.log(error.message);
    }
};
// applyCoupon==============================================================================================================================

function calculateDiscountedTotal(total, discountPercentage) {
    if (discountPercentage < 0 || discountPercentage > 100) {
        throw new Error('Discount percentage must be between 0 and 100.');
    }

    const discountAmount = (discountPercentage / 100) * total;
    const discountedTotal = total - discountAmount;

    return discountedTotal;
};


const applyCoupon = async (req, res) => {
    try {
        const { couponCode,productTotal } = req.body;
        const userId = req.session.user_id;
        const coupon = await Coupon.findOne({ code: couponCode });
        console.log(couponCode)
        console.log(productTotal)

        let errorMessage;

        if (!coupon) {
            errorMessage = "Coupon not found";
            return res.json({ errorMessage });
        }

        const currentDate = new Date();

        if (coupon.expiry && currentDate > coupon.expiry) {
            errorMessage = "Coupon Expired";
            return res.json({ errorMessage });
        }

        if (coupon.usersUsed.length >= coupon.limit) {
            errorMessage = "Coupon limit Reached";
            return res.json({ errorMessage });
        }

        if (coupon.usersUsed.includes(userId)) {
            errorMessage = "You already used this coupon";
            return res.json({ errorMessage });
        }

        const cartData = await Cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .exec();

        const cartItems = cartData.items || [];
        const orderTotal = calculateSubtotal(cartItems);
        let discountedTotal = 0;

        if (coupon.type === "percentage") {
            discountedTotal = calculateDiscountedTotal(orderTotal, coupon.discount);
        } else if (coupon.type === "fixed") {
            discountedTotal = orderTotal - coupon.discount;
        }
        req.session.discountrate = discountedTotal;
        res.json({ discountedTotal, errorMessage, updatedTotal: discountedTotal + 100});

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ errorMessage: "Internal Server Error" });
    }
};


// razorpayOrder============================================================================================
const razorpayOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const { address, paymentMethod, couponCode } = req.body;
console.log('1')
        const userData = await User.findById(userId);
        const cartData = await Cart.findOne({ user: userId })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .populate("user");
console.log('2')
        if (!userData || !cartData) {
            console.error("User or cart not found.");
        }

        const cartItems = cartData.items || [];
        let totalAmount = 0;

        for (const cartItem of cartItems) {
            const product = cartItem.product;

            if (!product) {
                return res
                    .status(400)
                    .json({ success: false, error: "Product Not Found" });
            }

            if (product.stock < cartItem.quantity) {
                return res
                    .status(400)
                    .json({ success: false, error: "Product Out Of Stock" });
            }

            const priceToConsider = product.discountRate;
            console.log( 'hrllo'+product.stock)
            console.log( 'hi'+cartItem.quantity)
            product.stock -= cartItem.quantity;

            const itemTotal = priceToConsider * cartItem.quantity;
            totalAmount += parseFloat(itemTotal.toFixed(2));
console.log('output'+totalAmount)
            await product.save();
        }
        if (req.session.discountrate) {
            console.log(req.session.discountrate)
            totalAmount = parseFloat(req.session.discountrate) + 100;
            console.log(totalAmount + 'total mahn');
        }
        

        const orderData = new Order({
            user: userId,
            address: address,
            orderDate: new Date(),
            status: "succesfull",
            paymentMethod: paymentMethod,
            deliveryDate: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000),
            totalAmount: totalAmount,
            items: cartItems.map(cartItem => {
                const product = cartItem.product;

                const priceToConsider = product.discountPrice;

                return {
                    product: product._id,
                    quantity: cartItem.quantity,
                    price: priceToConsider,
                };
            }),
        });

        await orderData.save();

        const options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: orderData._id,
        };
console.log('herevalue')
        razorpay.orders.create(options, async (err, razorpayOrder) => {
            console.log('start')
            if (err) {
                console.log('in err')
                console.error("Error creating Razorpay order:", err);
                return res
                    .status(400)
                    .json({ success: false, error: "Payment Failed", User });
            } else {
                console.log('successs')
                res.status(200).json({
                    message: "Order placed successfully.",
                    order: razorpayOrder,
                });
            }
        });
    } catch (error) {
        console.error("An error occurred while placing the order: ", error);
        return res.status(400).json({ success: false, error: "Payment Failed" });
    }
};


// loadOrderSuccess=======================================================================================

const loadOrderSuccess = async (req, res) => {
    try {
        const user = req.session.user_id;
        await Cart.deleteOne({ user: user });

        const orderData = await Order.findOne({ user: user })
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            })
            .sort({ orderDate: -1 });
        if (
            orderData.paymentMethod == "Online Payment" ||
            orderData.paymentMethod == "Wallet"
        ) {
            Order.paymentStatus = "Payment Successful";
            await orderData.save();
            if (orderData.paymentMethod == "Online Payment") {
                const transactiondebit = new Transaction({
                    user: user,
                    amount: orderData.totalAmount,
                    type: "debit",
                    paymentMethod: orderData.paymentMethod,
                    orderId: orderData._id,
                    description: `Paid using RazorPay `,
                });
                await transactiondebit.save();
            }
        }

        res.render("orderSuccess", { orderData });
    } catch (error) {
        console.error("Error fetching order details:", error);
    }
};

// ! order failed page
const orderFailed = async (req, res) => {
    try {
        const error = req.query.error;
        res.render("orderFailed", { error });
    } catch (error) {
        console.log(error.message);
    }
};



















module.exports = {
    loadcheckout,placeOrderCodWallet,invoice,listOrders,buyNow,orderDetails,cancelOrder,applyCoupon,razorpayOrder,loadOrderSuccess,orderFailed
}