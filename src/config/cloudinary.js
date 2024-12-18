const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dylec1boa',
    api_key: '861352891457394',
    api_secret: 'KkFAWOeYRdqseKETptDnPz6eJVE',
});
module.exports = cloudinary;
