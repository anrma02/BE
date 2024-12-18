const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');
const EmailService = require('./EmailService');


const createOrder = (newOrder) => {
    return new Promise(async (resolve, reject) => {
        const {
            orderItems,
            paymentMethod,
            deliveryMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            fullName,
            address,
            city,
            phone,
            user,
            isPaid,
            paidAt,
            email,
        } = newOrder;
        try {
            const promises = orderItems.map(async (order) => {
                const storyData = await Story.findOneAndUpdate(
                    {
                        _id: order.story,  
                        countInStock: { $gte: order.amount },  
                    },
                    {
                        $inc: {
                            countInStock: -order.amount,
                            sold: +order.amount,
                        },
                    },
                    { new: true },
                );
                if (storyData) {
                    return {
                        status: 'OK',
                        message: 'SUCCESS',
                    };
                } else {
                    return {
                        status: 'OK',
                        message: 'ERR',
                        id: order.story, // Replace product with story
                    };
                }
            });
            const results = await Promise.all(promises);
            const newData = results && results.filter((item) => item.id);
            if (newData.length) {
                const arrId = [];
                newData.forEach((item) => {
                    arrId.push(item.id);
                });
                resolve({
                    status: 'ERR',
                    message: `Story with id: ${arrId.join(',')} is out of stock`,
                });
            } else {
                const createdOrder = await Order.create({
                    orderItems,
                    shippingAddress: {
                        fullName,
                        address,
                        city,
                        phone,
                        email,
                    },
                    paymentMethod,
                    deliveryMethod,
                    itemsPrice,
                    shippingPrice,
                    totalPrice,
                    user: user,
                    isPaid,
                    paidAt,
                });
                if (createdOrder) {
                    resolve({
                        status: 'OK',
                        message: 'success',
                    });
                }
            }
        } catch (e) {
            reject(e);
        }
    });
};

const getAllOrderDetail = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.find({
                user: id,
            });
            if (order === null) {
                resolve({
                    status: 'ERR',
                    message: 'The order is not defined',
                });
            }
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: order,
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getOrderDetail = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.findById({
                _id: id,
            });
            if (order === null) {
                resolve({
                    status: 'ERR',
                    message: 'The order is not defined',
                });
            }
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: order,
            });
        } catch (e) {
            reject(e);
        }
    });
};
const cancelOrderDetail = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let order = [];
            const promises = data.map(async (order) => {
                const productData = await Product.findOneAndUpdate(
                    {
                        _id: order.product,
                    },
                    {
                        $inc: {
                            countInStock: +order.amount,
                            sold: -order.amount,
                        },
                    },
                    { new: true },
                );
                if (productData) {
                    order = await Order.findByIdAndDelete(id);
                    if (order === null) {
                        resolve({
                            status: 'ERR',
                            message: 'The order is not defined',
                        });
                    }
                } else {
                    return {
                        status: 'OK',
                        message: 'ERR',
                        id: order.product,
                    };
                }
            });
            const results = await Promise.all(promises);
            const newData = results && results[0] && results[0].id;

            if (newData) {
                resolve({
                    status: 'ERR',
                    message: `San pham voi id: ${newData} khong ton tai`,
                });
            }
            resolve({
                status: 'OK',
                message: 'success',
                data: order,
            });
        } catch (e) {
            reject(e);
        }
    });
};
const getAllOrder = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allOrder = await Order.find().sort({ createdAt: -1, updatedAt: -1 });
            resolve({
                status: 'OK',
                message: 'Success',
                data: allOrder,
            });
        } catch (e) {
            reject(e);
        }
    });
};
const deleteOrder = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkOrder = await Order.findOne({
                _id: id,
            });
            if (checkOrder === null) {
                resolve({
                    status: 'ERR',
                    message: 'The user is not defined',
                });
            }

            await Order.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Delete user success',
            });
        } catch (e) {
            reject(e);
        }
    });
};
module.exports = {
    createOrder,
    getAllOrderDetail,
    getOrderDetail,
    cancelOrderDetail,
    getAllOrder,
    deleteOrder,
};
