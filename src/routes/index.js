const UserRoute = require('./UserRouter');
const ProductRoute = require('./ProductRouter');
const OrderRoute = require('./OrderRouter');
const PaymentRouter = require('./PaymentRouter');
const CategoryRouter = require('./CategoryRouter');
const CommentRouter = require('./CommentRouter');
const StoryRoute = require('./StoryRoutes');

const routes = (app) => {
    app.use('/api/user', UserRoute);
    app.use('/api/product', ProductRoute);
    app.use('/api/order', OrderRoute);
    app.use('/api/payment', PaymentRouter);
    app.use('/api/category', CategoryRouter);
    app.use('/api/comment', CommentRouter);
    app.use('/api/story', StoryRoute);
};

module.exports = routes;
