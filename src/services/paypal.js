const paypal = require('@paypal/checkout-server-sdk');
const Order = require('../models/OrderModel'); // Import Order model

// PayPal environment setup (sandbox for testing, live for production)
let environment = new paypal.core.SandboxEnvironment(
    'AdSHcWxFpKUvd1_xeMWgAWGCTGpX8D6pDqZ58YTbFfhruFqcc0yPLCYWiMEUuZeEU8GBURVsSFVBXc6-',
    'EKQEO5Ln03Kqnv0FOwnMwer_ZEw0n6IGUsXdjuoRPUiblA9qIAy4abl8fhEfYigQWLMaTgaEUYwB2nkn',
);
let client = new paypal.core.PayPalHttpClient(environment);

async function createPaypalOrder(orderId, orderTotal) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
            {
                amount: {
                    currency_code: 'USD',
                    value: orderTotal.toFixed(2),
                },
            },
        ],
    });

    try {
        const order = await client.execute(request);

        // Step 2: Update the Order with PayPal payment info
        const orderUpdate = await Order.findByIdAndUpdate(
            orderId,
            {
                paymentMethod: 'PayPal',
                paymentDetails: {
                    transactionId: order.result.id,
                    transactionStatus: order.result.status,
                    transactionDate: new Date(),
                    paymentUrl: order.result.links.find((link) => link.rel === 'approve').href,
                    vnPayResponse: order.result,
                },
            },
            { new: true },
        );

        return orderUpdate; // Return the updated order with PayPal payment info
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        throw new Error('Failed to create PayPal order');
    }
}

module.exports = { createPaypalOrder };
