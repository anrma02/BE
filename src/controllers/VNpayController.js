const querystring = require('qs');
const crypto = require('crypto');
const Order = require('../models/OrderModel');

// Hàm tạo URL VNPay cho thanh toán
exports.createVNPayPayment = async (req, res) => {
    try {
        const { paymentMethod, deliveryMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, city, phone } =
            req.body;

        const order = new Order({
            orderItems: req.body.orderItems || [],
            shippingAddress: {
                fullName: req.body.fullName,
                address: req.body.address,
                city: req.body.city,
                phone: req.body.phone,
                email: req.body.email || '',
            },
            paymentMethod: req.body.paymentMethod, // Phương thức thanh toán
            deliveryMethod: req.body.deliveryMethod, // Phương thức giao hàng
            itemsPrice: req.body.itemsPrice, // Tổng giá trị sản phẩm
            shippingPrice: req.body.shippingPrice, // Phí vận chuyển
            totalPrice: req.body.totalPrice, // Tổng giá trị đơn hàng
            user: req.body.user, // ID người dùng
        });

        // Lưu đơn hàng vào cơ sở dữ liệu
        const savedOrder = await order.save();

        // Nếu phương thức thanh toán là COD, trả về thông tin đơn hàng
        if (paymentMethod === 'later_money') {
            return res.status(200).json({
                message: 'Order placed successfully with COD',
                order,
            });
        }

        // Xử lý VNPay nếu không phải COD
        const tmnCode = process.env.VNPAY_TMN_CODE;
        const secretKey = process.env.VNPAY_HASH_SECRET;
        const vnpUrl = process.env.VNPAY_URL;
        const returnUrl = process.env.VNPAY_RETURN_URL;

        const date = new Date();
        const createDate = date.toISOString().slice(0, 19).replace('T', '');
        const orderId = order._id.toString();
        const totalAmount = totalPrice * 100; // Convert to VNPay units

        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: tmnCode,
            vnp_Amount: totalAmount,
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: 'Thanh toan don hang',
            vnp_OrderType: 'other',
            vnp_Locale: 'vn',
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: req.ip,
            vnp_CreateDate: createDate,
        };

        // Tạo chữ ký và URL
        const sortedParams = sortObject(vnpParams);
        const signData = querystring.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        sortedParams['vnp_SecureHash'] = signed;
        const paymentUrl = `${vnpUrl}?${querystring.stringify(sortedParams, { encode: true })}`;

        res.json({ paymentUrl });
    } catch (error) {
        // Bắt lỗi ValidationError và trả về thông báo chi tiết
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Order validation failed',
                errors: error.errors,
            });
        }

        console.error('Error creating VNPay payment:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// Hàm xử lý sau khi thanh toán thành công
exports.vnpayReturn = (req, res) => {
    let vnp_Params = req.query;

    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp các tham số theo thứ tự
    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const secretKey = process.env.VNPAY_HASH_SECRET;

    // Tạo lại chữ ký và so sánh với chữ ký trả về
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
        // Kiểm tra số tiền thanh toán (vnp_Amount)
        const amount = vnp_Params['vnp_Amount'] / 100; // VNPay gửi số tiền nhân với 100
        const orderId = vnp_Params['vnp_TxnRef'];

        Order.findById(orderId)
            .then((order) => {
                if (!order) {
                    return res.status(400).json({ message: 'Order not found', code: '01' });
                }

                // Kiểm tra nếu số tiền thanh toán không khớp với tổng giá trị đơn hàng
                if (order.totalPrice !== amount) {
                    return res.status(400).json({ message: 'Amount mismatch', code: '02' });
                }

                // Cập nhật trạng thái đơn hàng khi thanh toán thành công
                order.isPaid = true;
                order.paidAt = new Date();
                return order.save();
            })
            .then(() => res.json({ message: 'Payment success', code: '00' }))
            .catch((err) => res.status(500).json({ message: 'Payment error', error: err.message }));
    } else {
        res.status(400).json({ message: 'Invalid signature', code: '97' });
    }
};
// Hàm sắp xếp đối tượng (params) theo thứ tự chữ cái
function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    keys.forEach((key) => {
        sorted[key] = obj[key];
    });
    return sorted;
}
