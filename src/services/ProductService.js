const Product = require('../models/ProductModel');
const bcrypt = require('bcrypt');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyDYhrS5mbe2jxA4Izgi3dBPDBlOZswKnEc';
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
};

const createProduct = async (req, res) => {
    const { title, content, age, image, price, discount, author, description } = req.body;

    // Kiểm tra các giá trị bắt buộc
    if (!title || !content || !age || !image || !price || !discount || !author || !description) {
        return res.status(400).json({ error: 'Thiếu thông tin đầu vào!' });
    }

    // Nếu age là khoảng, ví dụ "5-8", ta sẽ tính tuổi trung bình
    let ageValue = age;
    if (age.includes('-')) {
        const [minAge, maxAge] = age.split('-').map(Number); // Tách chuỗi và chuyển thành số
        ageValue = (minAge + maxAge) / 2; // Tính tuổi trung bình
    }

    // Tạo yêu cầu động
    const userInputText = `Tạo câu chuyện cho trẻ em từ ${ageValue} tuổi, câu chuyện ${title}, và tất cả hình ảnh theo phong cách ${image}. Nội dung câu chuyện về ${content}. Hãy cung cấp 5 chương, kèm theo mô tả chi tiết cho hình ảnh tương ứng với từng chương, và lời nhắc tạo hình ảnh cho bìa sách với tên câu chuyện. Tất cả yêu cầu cần ở định dạng JSON.`;

    try {
        const chatSession = await model.startChat({
            generationConfig,
            history: [
                {
                    role: 'user',
                    parts: [{ text: userInputText }],
                },
            ],
        });

        const result = await chatSession.sendMessage(userInputText); // Gọi trực tiếp message
        let responseText = result.response.text(); // Nhận phản hồi dưới dạng text

        // Kiểm tra nếu kết quả trả về không phải JSON hợp lệ
        let storyData = {};
        try {
            responseText = responseText.replace(/```json|\n|```/g, '').trim(); // Loại bỏ thẻ json và dấu \n
            storyData = JSON.parse(responseText); // Parse JSON từ text
        } catch (err) {
            return res.status(500).json({ error: 'Lỗi trong quá trình phân tích kết quả AI!' });
        }

        // Tạo đối tượng Story mới từ dữ liệu AI
        const newStory = new Story({
            title: storyData.title || title,
            content: content,
            genre: storyData.genre || 'Chưa xác định', // Cung cấp giá trị mặc định nếu không có
            age: ageValue,
            price: price,
            discount: discount,
            description: storyData.cover_image?.description || description, // Nếu không có mô tả bìa, dùng mô tả từ input
            author: author,
            image: storyData.cover_image?.url || image,
        });

        await newStory.save(); // Lưu câu chuyện vào DB

        res.status(201).json({
            message: 'Câu chuyện được tạo thành công!',
            story: newStory,
        });
    } catch (error) {
        console.error('Error creating story:', error); // Log lỗi để debug dễ dàng hơn
        res.status(500).json({ error: 'Lỗi khi tạo truyện!' });
    }
};

const updateProduct = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkProduct = await Product.findOne({
                _id: id,
            });
            if (checkProduct === null) {
                resolve({
                    status: 'ERR',
                    message: 'The product is not defined',
                });
            }

            const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true });
            resolve({
                status: 'OK',
                message: 'SUCCESS update',
                data: updatedProduct,
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteProduct = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkProduct = await Product.findOne({
                _id: id,
            });
            if (checkProduct === null) {
                resolve({
                    status: 'ERR',
                    message: 'The user is not defined',
                });
            }
            await Product.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Delete SUCCESS',
            });
        } catch (e) {
            reject(e);
        }
    });
};

const deleteManyProduct = (ids) => {
    return new Promise(async (resolve, reject) => {
        try {
            await Product.deleteMany({ _id: ids });
            resolve({
                status: 'ERR',
                message: 'Delete success',
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getDetailProduct = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const product = await Product.findOne({
                _id: id,
            });
            if (product === null) {
                resolve({
                    status: 'ERR',
                    message: 'The product is not defined',
                });
            }
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: product,
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllProduct = (limit, page, sort, filter) => {
    return new Promise(async (resolve, reject) => {
        try {
            const totalProduct = await Product.count();
            let allProduct = [];

            if (filter) {
                const label = filter[0];
                const allObjectFilter = await Product.find({ [label]: { $regex: filter[1], $options: 'i' } })
                    .limit(limit)
                    .skip(page * limit)
                    .sort({ createdAt: -1, updatedAt: -1 });
                resolve({
                    status: 'OK',
                    message: 'Success',
                    data: allObjectFilter,
                    total: totalProduct,
                    pageCurrent: Number(page + 1),
                    totalPage: Math.ceil(totalProduct / limit),
                });
            }
            if (sort) {
                const objectSort = {};
                objectSort[sort[1]] = sort[0];
                const allProductSort = await Product.find()
                    .limit(limit)
                    .skip(page * limit)
                    .sort(objectSort)
                    .sort({ createdAt: -1, updatedAt: -1 });
                resolve({
                    status: 'OK',
                    message: 'Success',
                    data: allProductSort,
                    total: totalProduct,
                    pageCurrent: Number(page + 1),
                    totalPage: Math.ceil(totalProduct / limit),
                });
            }
            if (!limit) {
                allProduct = await Product.find().sort({ createdAt: -1, updatedAt: -1 });
            } else {
                allProduct = await Product.find()
                    .limit(limit)
                    .skip(page * limit)
                    .sort({ createdAt: -1, updatedAt: -1 });
            }
            resolve({
                status: 'OK',
                message: 'Success',
                data: allProduct,
                total: totalProduct,
                pageCurrent: Number(page + 1),
                totalPage: Math.ceil(totalProduct / limit),
            });
        } catch (e) {
            reject(e);
        }
    });
};

const getAllType = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allType = await Product.distinct('type');
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: allType,
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createProduct,
    updateProduct,
    getDetailProduct,
    deleteProduct,
    getAllProduct,
    deleteManyProduct,
    getAllType,
};
