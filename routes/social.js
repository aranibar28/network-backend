const { Router } = require('express');
const { validateJWT } = require('../middlewares/authenticated');

const ctrl = require('../controllers/social');
const router = Router();

router.get('/get_invitations/:limited?', [validateJWT], ctrl.get_invitations);
router.post('/send_invitation_friend', [validateJWT], ctrl.send_invitation_friend);
router.post('/select_invitation_friend', [validateJWT], ctrl.select_invitation_friend);
router.post('/select_invitations_friends', [validateJWT], ctrl.select_invitations_friends);

module.exports = router;
