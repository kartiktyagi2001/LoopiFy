const cloudinary = require('cloudinary').v2;
const fs = require('fs');
// import { v2 as cloudinary } from "cloudinary";
// import fs from 'fs';


// Configuration

cloudinary.config({ 
    cloud_name: process.env.cloud_name, 
    api_key: process.env.api_key, 
    api_secret: process.env.api_secret
});

// File Uploading

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath)
            return;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "loopify-listings"
        })

        fs.unlinkSync(localFilePath);

        console.log("uploaded file: ", response.url);
        return response;

    } catch(err){
        fs.unlinkSync(localFilePath);
        console.log(err);
        return null;
    }
}

module.exports = { uploadOnCloudinary };
// export {uploadOnCloudinary}