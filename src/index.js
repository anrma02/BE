const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const routes = require('./routes');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
dotenv.config();

const app = express();
const port = process.env.PORT;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

routes(app);

mongoose
    .connect(`mongodb://localhost:27017`)
    .then(() => {
        console.log('DB success');
    })
    .catch((err) => {
        console.log(err);
    });

app.listen(port, () => {
    console.log('server is running' + port);
});
