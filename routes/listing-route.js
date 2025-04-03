const express= require('express');
// const app = express();
const router = express.Router();

const auth = require('../middlewares/auth')
const upload = require('../middlewares/multer');
const supabase = require('../utils/supabase')
const listingModel = require('../models/listing');

router.post('/', auth,upload.array('images', 3), async(req, res) => {
    try{

        //debug logs
        console.log("req.user: ", req.user);
        console.log("req.body: ", req.body);

        const { title, description, price, category, status} = req.body;

        // if (!req.user?._id) {
        //     return res.status(403).json({ 
        //       error: "User authentication failed",
        //       solution: "Try logging out and back in"
        //     });
        //   }

        const imageUrls = [];

        // uploading files to supabase

        for(const file of req.files){
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;

            //upload logic
            const {error: uploadError} = await supabase.storage
                .from('listings')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false   //to avoid file overwritting
                });

            if(uploadError) throw uploadError;

            //public url for uploaded file
            const {data: urlData} = await supabase.storage
                .from('listings')
                .getPublicUrl(fileName);

            imageUrls.push(urlData.publicUrl);
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

        //debug log
        console.log("[POST /listings] New Listing:", newListing);

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