const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

cloudinary.config({
   cloud_name: process.env.CLOUD_NAME,
   api_key: process.env.CLOUD_API_KEY,
   api_secret: process.env.CLOUD_API_SECRET,
   secure: true,
});

const tempUpload = fileUpload({
   useTempFiles: true,
   tempFileDir: "uploads",
});

const uploadImage = async (filePath, folderName) => {
   return await cloudinary.uploader.upload(filePath, {
      folder: "social/" + folderName,
      format: "webp",
      width: "600",
      crop: "limit",
   });
};

const deleteImage = async (publicId) => {
   return await cloudinary.uploader.destroy(publicId);
};

module.exports = {
   tempUpload,
   uploadImage,
   deleteImage,
};
