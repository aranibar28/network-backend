const { Router } = require('express');
const { validateJWT } = require('../middlewares/authenticated');
const ctrl = require('../controllers/user');
const router = Router();

router.post('/login_user', ctrl.login_user);
router.post('/create_user', ctrl.create_user);
router.get('/read_users', [validateJWT], ctrl.read_users);
router.get('/read_user_by_id/:id', [validateJWT], ctrl.read_user_by_id);
router.put('/update_user/:id', [validateJWT], ctrl.update_user);
router.put('/update_password/:id', [validateJWT], ctrl.update_password);
router.delete('/delete_user/:id', [validateJWT], ctrl.delete_user);
router.delete('/delete_friend/:id', [validateJWT], ctrl.delete_friend);
router.get('/refresh_token', [validateJWT], ctrl.refresh_token);
router.post('/validate_email', ctrl.validate_email);

router.get('/get_users_random', [validateJWT], ctrl.get_users_random);
router.get('/get_users_friends/:id?', [validateJWT], ctrl.get_users_friends);

module.exports = router;
