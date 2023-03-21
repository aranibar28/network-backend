const { Router } = require("express");
const { validateJWT } = require("../middlewares/authenticated");
const { tempUpload } = require("../middlewares/cloudinary");

const ctrl = require("../controllers/storie");
const router = Router();

router.post("/create_storie", [validateJWT, tempUpload], ctrl.create_storie);
router.get("/get_stories", [validateJWT], ctrl.get_stories);

module.exports = router;
