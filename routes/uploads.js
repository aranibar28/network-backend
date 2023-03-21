const { Router } = require("express");
const { validateJWT } = require("../middlewares/authenticated");
const { tempUpload } = require("../middlewares/cloudinary");

const ctrl = require("../controllers/upload");
const router = Router();

router.put("/upload_image/:id", [validateJWT, tempUpload], ctrl.upload_image);

module.exports = router;


