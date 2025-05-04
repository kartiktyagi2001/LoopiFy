const express= require('express');
// const app = express();
const router = express.Router();

const auth = require('../middlewares/auth')
const upload = require('../middlewares/multer');
const supabase = require('../utils/supabase')
const listingModel = require('../models/listing');

// CREATE LISTING

router.post('/new', auth,upload.array('images', 3), async(req, res) => {
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

// GET ALL LISTINGS
router.get('/fetch', async (req, res) => {
    try {
      const { category, status, minPrice, maxPrice } = req.query;
      const filters = {};
  
      // Filter setup (same as before)
      if (category) filters.category = category.toLowerCase();
      if (status) filters.status = status.toLowerCase();
      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = parseFloat(minPrice);
        if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
      }
  
      const listings = await listingModel.find(filters).populate('postedBy', 'name email');
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  });
  
  // GET SINGLE LISTING BY ID
router.get('/fetch/:id', async (req, res) => {
    try {
      const listing = await listingModel.findById(req.params.id).populate('postedBy', 'name email');
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      res.json(listing);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

// UPDATE LISTING
router.patch('/update/:id', auth, upload.array('images', 3), async (req, res) => {
    try {
      const { title, description, price, category, status } = req.body;
      const updates = { title, description, price, category, status };
  
      // Check ownership
      const listing = await listingModel.findOne({
        _id: req.params.id,
        postedBy: req.user._id
      });
      if (!listing) return res.status(404).json({ error: 'Listing not found or unauthorized' });
  
      // Handle new images (if uploaded)
      if (req.files && req.files.length > 0) {
        const imageUrls = [];
        for (const file of req.files) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${file.originalname}`;
          // Upload to Supabase (same as your POST logic)
          const { error: uploadError } = await supabase.storage
            .from('listings')
            .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });
          if (uploadError) throw uploadError;
          const { data: urlData } = await supabase.storage.from('listings').getPublicUrl(fileName);
          imageUrls.push(urlData.publicUrl);
        }
        updates.images = [...listing.images, ...imageUrls]; // Merge old + new images
      }
  
      // Update listing
      const updatedListing = await listingModel.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true } // Return the updated listing
      );
  
      res.json({ message: 'Listing updated', listing: updatedListing });
    } catch (error) {
      res.status(400).json({ error: 'Failed to update listing', details: error.message });
    }
  });

// DELETE LISTING
router.delete('/delete/:id', auth, async (req, res) => {
    try {
      // Find listing owned by the logged-in user
      const listing = await listingModel.findOneAndDelete({
        _id: req.params.id,
        postedBy: req.user._id
      });
  
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found or unauthorized' });
      }
  
      // Delete images from Supabase (Optional but recommended)
      for (const url of listing.images) {
        const fileName = url.split('/').pop(); // Extract filename from URL
        const { error } = await supabase.storage.from('listings').remove([fileName]);
        if (error) console.error('Supabase delete error:', error); // Log errors but proceed
      }
  
      res.json({ message: 'Listing deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Server error during deletion' });
    }
  });



module.exports = router