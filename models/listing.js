const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    category: {
        type: String,
        enum: ["service", "SERVICE", "Service", "product", "Product", "PRODUCT"],   //only these options are available
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
        type: String    //i will upload images from user to cloudinary and url will come here
    }],
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    status: {
        type: String,
        enum: ["available", "sold", "rented"],
        default: "available"
    }
}, {timestamps: true});

module.exports = mongoose.model("listings", listingSchema);