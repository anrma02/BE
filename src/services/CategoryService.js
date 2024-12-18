const Category = require('../models/CategoryModel');

const createCategory = (newProduct) => {
    return new Promise(async (resolve, reject) => {
        const { nameType, image } = newProduct;
        try {
            const checkCategory = await Category.findOne({
                nameType: nameType,
            });
            if (checkCategory !== null) {
                resolve({
                    status: 'ERR',
                    message: 'The Category of product is already',
                });
            }
            const newCategory = await Category.create({
                nameType,
                image,
            });
            if (newCategory) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: newCategory,
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

const deleteCategory = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkUser = await Category.findOne({
                _id: id,
            });
            if (checkUser === null) {
                resolve({
                    status: 'ERR',
                    message: 'The Category is not defined',
                });
            }

            await Category.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Delete Category success',
            });
        } catch (e) {
            reject(e);
        }
    });
};
const getAllCategory = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allCategory = await Category.find().sort({ createdAt: -1, updatedAt: -1 });
            resolve({
                status: 'OK',
                message: 'Success',
                data: allCategory,
            });
        } catch (e) {
            reject(e);
        }
    });
};
module.exports = {
    createCategory,
    deleteCategory,
    getAllCategory,
};
