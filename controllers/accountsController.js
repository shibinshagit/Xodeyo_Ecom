const Transaction = require("../models/transactionModels");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");




const listTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let query = {};
        if (req.query.type) {
            if (req.query.type === "debit") {
                query.type = "debit";
            } else if (req.query.type === "credit") {
                query.type = "credit";
            }
        }
        const limit = 7;
        const totalCount = await Transaction.countDocuments(query);

        const totalPages = Math.ceil(totalCount / limit);

        const transactions = await Transaction.aggregate([
            { $match: query },
            { $sort: { date: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);
        res.render("listTransactons", {
            transactions,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.log(error.message);
    }
};



// listSales-------------------------------------SALES---------------------------------------------------------------

const listSales = async (req, res) => {
    try {
        let query = { paymentStatus: "Payment Successful" };

        if (req.query.paymentMethod) {
            if (req.query.paymentMethod === "Online Payment") {
                query.paymentMethod = "Online Payment";
            } else if (req.query.paymentMethod === "Wallet") {
                query.paymentMethod = "Wallet";
            } else if (req.query.paymentMethod === "Cash On Delivery") {
                query.paymentMethod = "Cash On Delivery";
            }
        }

        const orders = await Order.find(query)
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

        // total revenue
        const totalRevenue = orders.reduce(
            (acc, order) => acc + order.totalAmount,
            0
        );

        const totalSales = orders.length;

        // total Sold Products
        const totalProductsSold = orders.reduce(
            (acc, order) => acc + order.items.length,
            0
        );

        res.render("listSales", {
            orders,
            totalRevenue,
            totalSales,
            totalProductsSold,
            req,
        });
    } catch (error) {
        console.log(error.message);
    }
};

// orderStatus==================================================================================================================

const orderStatus = async (req, res) => {
    try {
        const OrderStatus = req.query.status;
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId).populate({
            path: "items.product",
            model: "Product",
        });

        if (OrderStatus == 'Product Cancel') {
            const productId = req.query.productId
            for (const item of order.items) {
                if (item.product._id == productId) {
                    item.status = "Cancel Requested"
                }
            }
            await order.save();
            return res.redirect(`/userorderdetails?orderId=${orderId}`)
        }
        if (OrderStatus == "Cancelled") {
            for (const item of order.items) {
                const productId = item.product._id;
                const orderedQuantity = item.quantity;
                const Product = await Product.findById(productId);
                if (order.paymentMethod == "Cash On Delivery") {
                    order.paymentStatus = "Declined";
                } else {
                    order.paymentStatus == "Refunded";
                }
                if (Product) {
                    Product.quantity += orderedQuantity;
                    await Product.save();
                }
            }
        }
        if (OrderStatus == "Delivered") {
            order.deliveryDate = new Date();
            order.paymentStatus = "Payment Successful";
        }

        Order.status = OrderStatus;
        if (req.query.reason) {
            order.reason = req.query.reason;
        }
        await order.save();

        if (req.query.orderDetails) {
            res.redirect(`/admin/orderdetails?orderId=${orderId}`);
        } else if (
            order.status == "Return Requested" ||
            order.status == "Cancel Requested"
        ) {
            res.redirect(`/userorderdetails?orderId=${orderId}`);
        } else {
            res.redirect("/admin/orders");
        }
    } catch (error) {
        console.log(error.message);
    }
};

// orderDetails=========================================================================================================

const orderDetails = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findOne({ _id: orderId })
            .populate("user")
            .populate({
                path: "address",
                model: "Address",
            })
            .populate({
                path: "items.product",
                model: "Product",
            });
        res.render("show-order", { orders: order });
    } catch (error) {
        console.log(error.message);
    }
};

















module.exports = {
    listTransactions,listSales,orderStatus,orderDetails
}