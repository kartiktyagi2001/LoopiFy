const express= require('express');
// const app = express();
const router = express.Router();

const auth = require('../middlewares/auth')
const upload = require('../middlewares/multer');
const {uploadOnCloudinary} = require('../utils/cloudinary');
const listingModel = require('../models/listing');

router.post('/', auth,upload.array('images', 3), async(req, res) => {
    try{
        const { title, description, price, category, postedBy, status} = req.body;

        if (!req.user?._id) {
            return res.status(403).json({ 
              error: "User authentication failed",
              solution: "Try logging out and back in"
            });
          }

        const imageUrls = [];

        // uploading files to cloudinary

        for(const file of req.files) {
        const uploadedImage = await uploadOnCloudinary(file.path);
            if(uploadedImage)
                imageUrls.push(uploadedImage.secure_url);
        }

        const newListing = new listingModel({
            title,
            description,
            price,
            category,
            images: imageUrls,
            postedBy: req.user._id, //id is attached by auth middleware iff the user is authenticated
            status
        });

        await newListing.save();
        res.status(201).json({
            message: "Service/Product listed successfully!",
            listing: newListing
        });

    } catch (error) {
        res.status(400).json({ error: 'Failed to save listing', details: error.message });
    }
});

module.exports = router