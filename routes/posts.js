const { Router } = require('express');
const { validateJWT } = require('../middlewares/authenticated');
const { tempUpload } = require('../middlewares/cloudinary');

const ctrl = require('../controllers/post');
const router = Router();

router.post('/create_post', [validateJWT, tempUpload], ctrl.create_post);
router.put('/update_post/:id', [validateJWT, tempUpload], ctrl.update_post);
router.get('/read_posts/:id?', [validateJWT], ctrl.read_posts);
router.get('/read_posts_with_media/:id?', [validateJWT], ctrl.read_posts_with_media);
router.get('/read_post_by_id/:post', [validateJWT], ctrl.read_post_by_id);
router.delete('/delete_post/:id', [validateJWT], ctrl.delete_post);

router.post('/set_like_post', [validateJWT], ctrl.set_like_post);
router.post('/set_comment_post', [validateJWT], ctrl.set_comment_post);
router.get('/get_notifications', [validateJWT], ctrl.get_notifications);
router.get('/select_notification/:id', [validateJWT], ctrl.select_notification);

module.exports = router;
