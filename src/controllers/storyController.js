const Story = require('../models/StoryRoutes');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

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
const createStory = async (req, res) => {
    const { name, content, age, image, price, discount, author, description, sold, rating, pricesale, type } = req.body;

    const requiredFields = [
        { field: 'name', value: name },
        { field: 'content', value: content },
        { field: 'age', value: age },
        // { field: 'image', value: image },
        { field: 'price', value: price },
        { field: 'author', value: author },
        { field: 'discount', value: discount },
        // { field: 'description', value: description },
        { field: 'sold', value: sold },
        { field: 'rating', value: rating },
        { field: 'pricesale', value: pricesale },
        { field: 'type', value: type },
    ];

    // Check for missing required fields and build a message
    const missingFields = requiredFields.filter((item) => !item.value).map((item) => item.field);

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: `Thiếu thông tin đầu vào: ${missingFields.join(', ')}`,
        });
    }

    let ageValue = age;
    if (age.includes('-')) {
        const [minAge, maxAge] = age.split('-').map(Number);
        if (isNaN(minAge) || isNaN(maxAge)) {
            return res.status(400).json({ error: 'Độ tuổi không hợp lệ!' });
        }
        ageValue = Math.round((minAge + maxAge) / 2);
    }

    const userInputText = `
        Tạo câu chuyện từ ${ageValue} tuổi, câu chuyện ${name}, và tất cả hình ảnh theo phong cách ${image}.
        Nội dung câu chuyện về ${content} với ${type}. Hãy cung cấp 30 chương, kèm theo mô tả chi tiết cho hình ảnh tương ứng với từng chương,
        và lời nhắc tạo hình ảnh cho bìa sách với tên câu chuyện. Tất cả yêu cầu cần ở định dạng JSON.`;

    try {
        // Start a chat session with the AI model
        const chatSession = await model.startChat({
            generationConfig,
            history: [
                {
                    role: 'user',
                    parts: [{ text: userInputText }],
                },
            ],
        });

        // Send the user input and get a response
        const result = await chatSession.sendMessage(userInputText);
        let responseText = result.response.text(); // Get the AI-generated response as text

        // Process the AI response (ensure it's valid JSON)
        let storyData = {};
        try {
            // Clean up the response text and remove code block markers
            responseText = responseText.replace(/```json|\n|```/g, '').trim();
            storyData = JSON.parse(responseText); // Parse the cleaned response into JSON
        } catch (err) {
            return res.status(500).json({ error: 'Lỗi trong quá trình phân tích kết quả AI!' }); // JSON parse error
        }

        // Prepare new story data using AI response or fallback to input data
        const newStoryData = {
            name: storyData.name || name,
            content,
            genre: storyData.genre || 'Chưa xác định', // Default value for genre if not provided by AI
            age: ageValue,
            price,
            discount,
            description: storyData.cover_image?.description || responseText,
            author,
            image: storyData.cover_image?.url || image, // Use AI-generated image URL or fallback to input image
            sold,
            rating,
            type,
            pricesale,
        };

        // Create a new Story document
        const newStory = new Story(newStoryData);
        await newStory.save(); // Save the story to the database

        // Return success response
        res.status(201).json({
            message: 'Câu chuyện được tạo thành công!',
            status: 'OK',
            story: newStory,
        });
    } catch (error) {
        // Log the error for debugging
        console.error('Error creating story:', error);
        res.status(500).json({ error: 'Lỗi khi tạo câu chuyện!', status: 'ERR' }); // Generic error response
    }
};

const getAllStories = async (req, res) => {
    try {
        // Lấy các tham số từ query
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 10);
        const skip = parseInt(req.query.skip) || (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const filters = {};

        if (searchQuery) {
            filters.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { author: { $regex: searchQuery, $options: 'i' } },
                { type: { $regex: searchQuery, $options: 'i' } },
            ];
        }

        const stories = await Story.find(filters).skip(skip).limit(limit);
        if (stories.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy truyện nào phù hợp với tìm kiếm!',
            });
        }
        const totalStories = await Story.countDocuments(filters);

        res.status(200).json({
            message: 'Danh sách câu chuyện',
            stories,
            pagination: {
                page,
                limit,
                skip,
                totalStories,
                totalPages: Math.ceil(totalStories / limit),
            },
        });
    } catch (error) {
        console.error(error); // Log lỗi ra console để debug
        res.status(500).json({ error: 'Lỗi khi lấy danh sách câu chuyện!', details: error.message });
    }
};

const getStoryById = async (req, res) => {
    const { id } = req.params; // Lấy ID từ URL

    try {
        const story = await Story.findById(id); // Tìm câu chuyện theo ID
        if (!story) {
            return res.status(404).json({ error: 'Câu chuyện không tồn tại!' });
        }
        res.status(200).json({
            message: 'Thông tin câu chuyện',
            story,
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy câu chuyện!' });
    }
};

const deleteStory = async (req, res) => {
    const { id } = req.params; // Lấy ID từ URL

    try {
        const deletedStory = await Story.findByIdAndDelete(id); // Xóa câu chuyện theo ID
        if (!deletedStory) {
            return res.status(404).json({ error: 'Câu chuyện không tồn tại!' });
        }
        res.status(200).json({
            message: 'Câu chuyện đã được xóa thành công!',
        });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa câu chuyện!' });
    }
};

const updateStory = async (req, res) => {
    const { name, content, age, image, price, discount, author, description, sold, rating, pricesale, type } = req.body;

    // Kiểm tra nếu các trường cần thiết đã được cung cấp
    try {
        const story = await Story.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ error: 'Câu chuyện không tồn tại.' });
        }

        // Tính toán lại giá trị age nếu có dạng khoảng
        let ageValue = age;
        if (age.includes('-')) {
            const [minAge, maxAge] = age.split('-').map(Number);
            if (isNaN(minAge) || isNaN(maxAge)) {
                return res.status(400).json({ error: 'Độ tuổi không hợp lệ!' });
            }
            ageValue = Math.round((minAge + maxAge) / 2);
        }

        // Tạo câu lệnh yêu cầu AI tạo mô tả (description) mới
        const userInputText = `
            Tạo mô tả cho câu chuyện tên là "${name}", độ tuổi phù hợp là ${ageValue} tuổi, 
            thể loại là ${type}, và nội dung câu chuyện về ${content}. 
            Hãy cung cấp một mô tả chi tiết cho câu chuyện này.
        `;

        // Bắt đầu phiên chat với AI model
        const chatSession = await model.startChat({
            generationConfig,
            history: [
                {
                    role: 'user',
                    parts: [{ text: userInputText }],
                },
            ],
        });

        // Gửi yêu cầu và nhận phản hồi từ AI
        const result = await chatSession.sendMessage(userInputText);
        let responseText = result.response.text(); // Nhận câu trả lời từ AI

        // Xử lý phản hồi từ AI và lấy mô tả mới
        let description = '';
        try {
            responseText = responseText.replace(/```json|\n|```/g, '').trim(); // Làm sạch phản hồi
            description = responseText; // Cập nhật mô tả mới
        } catch (err) {
            return res.status(500).json({ error: 'Lỗi khi phân tích kết quả AI!' });
        }

        // Cập nhật câu chuyện trong cơ sở dữ liệu
        story.age = ageValue;
        story.type = type;
        story.name = name;
        story.content = content;
        story.description = description;
        story.image = image;
        story.price = price;
        story.discount = discount;
        story.author = author;
        story.sold = sold;
        story.rating = rating;
        story.pricesale = pricesale;

        await story.save(); // Lưu bản cập nhật vào cơ sở dữ liệu

        // Trả về câu trả lời thành công
        res.status(200).json({
            message: 'Cập nhật câu chuyện thành công!',
            story,
            status: 'OK',
        });
    } catch (error) {
        console.error('Error updating story:', error);
        res.status(500).json({ error: 'Lỗi khi cập nhật câu chuyện!', status: 'ERR' });
    }
};

module.exports = { createStory, getAllStories, getStoryById, deleteStory, updateStory };
