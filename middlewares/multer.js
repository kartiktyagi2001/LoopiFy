const multer = require('multer');
// const {storage} = require('../utils/cloudinary')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp") //local storage
    },
    filename: function (req, file, cb) {

      cb(null, file.originalname)
    }
  })

  const upload = multer({ storage });

  module.exports = upload;