const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { type } = require('os');

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        minlength: 2
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowecase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 4
    },
    clgId: {
        type: String,
        required: true
    },
    isVerified:{
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('user', userSchema);

