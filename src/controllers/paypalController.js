const Order = require('../models/OrderModel');
const { createPaypalOrder } = require('../services/paypal');
// Import Order model

// Example route to create PayPal order
async function createOrder(req, res) {
    const { orderItems, shippingAddress, itemsPrice, shippingPrice, totalPrice, user } = req.body;

    // Step 1: Create order document in the database
    const order = new Order({
        orderItems,
        shippingAddress,
        itemsPrice,
        shippingPrice,
        totalPrice,
        user,
    });

    try {
        const savedOrder = await order.save();

        // Step 2: Create PayPal order
        const updatedOrder = await createPaypalOrder(savedOrder._id, totalPrice);

        res.status(200).json({
            message: 'Order created successfully',
            order: updatedOrder,
            paypalUrl: updatedOrder.paymentDetails.paymentUrl, // Return PayPal URL for redirection
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
}

async function capturePaypalPayment(orderId, payerId) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
        const capture = await client.execute(request);

        // Update order with capture status
        const orderUpdate = await Order.findByIdAndUpdate(
            orderId,
            {
                isPaid: true,
                paidAt: new Date(),
                paymentDetails: {
                    ...capture.result,
                    transactionStatus: capture.result.status,
                    transactionDate: new Date(),
                },
            },
            { new: true },
        );

        return orderUpdate;
    } catch (error) {
        console.error('Error capturing PayPal payment:', error);
        throw new Error('Failed to capture PayPal payment');
    }
}
