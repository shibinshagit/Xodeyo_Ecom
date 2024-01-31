// * module imports

const { formatDate, generateHr, generateTableRow } = require('../helpers/createInvoice');
const Order = require('../models/orderModel')
const PDFDocument = require('pdfkit')
const fs = require("fs");


// ! function to generate PDF for user oder invoice
const generateInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const orders = await Order.findById(orderId)
            .populate('user')
            .populate({
                path: 'address',
                model: 'Address',
            })
            .populate({
                path: 'items.product',
                model: 'Product',
            });

        const doc = new PDFDocument();

        const fileName = `invoice_${orderId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        doc.pipe(res);

        doc
            .fillColor("#444444")
            .fontSize(20)
            .text("Xodeyo.com", 50, 57)
            .fontSize(10)
            .text("XodeyoDesigns.com", 200, 50, { align: "right" })
            .text("682301", 200, 65, { align: "right" })
            .text("Maradu ", 200, 80, { align: "right" })
            .moveDown();

        doc
            .fillColor("#444444")
            .fontSize(20)
            .text("Invoice", 50, 160);

        generateHr(doc, 185);

        const customerInformationTop = 200;

        doc
            .fontSize(10)
            .text("Invoice Number:", 50, customerInformationTop)
            .font("Helvetica-Bold")
            .text(orders._id, 150, customerInformationTop)
            .font("Helvetica")
            .text("Invoice Date:", 50, customerInformationTop + 15)
            .text(formatDate(new Date()), 150, customerInformationTop + 15)
            .text("Total Amount (Rs):", 50, customerInformationTop + 30)
            .text(
                `Rs ${orders.totalAmount}`, 150, customerInformationTop + 30
            )

            .font("Helvetica-Bold")
            .text(orders.address.name, 300, customerInformationTop)
            .font("Helvetica")
            .text(orders.address.houseName, 300, customerInformationTop + 15)
            .text(
                `${orders.address.city}, ${orders.address.state}, India`,
                300,
                customerInformationTop + 30
            )
            .moveDown();

        generateHr(doc, 252);

        const invoiceTableTop = 330;

        doc.font("Helvetica-Bold");
        generateTableRow(
            doc,
            invoiceTableTop,
            "Item",
            "Quantity",
            "Line Total"
        );
        generateHr(doc, invoiceTableTop + 20);
        doc.font("Helvetica");

        let position = 0;
        for (let i = 0; i < orders.items.length; i++) {
            position = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
                doc,
                position,
                orders.items[i].product.name,
                orders.items[i].quantity,
                `Rs ${orders.items[i].product.discountRate}`,
            );

        }

        generateHr(doc, 252);

        const totalPricePosition = position + 40;
        doc
            .font("Helvetica-Bold")
            .text("Total (with coupon discount):", 50, totalPricePosition)
            .font("Helvetica-Bold")
            .text(`Rs ${orders.totalAmount}`, 50, totalPricePosition, { align: "right" })

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating the invoice');
    }
}


module.exports = {
    generateInvoice
}