const { response } = require('express');
const { uploadImage } = require('../middlewares/cloudinary');

const Storie = require('../models/storie');
const User_Friend = require('../models/user_friend');

const moment = require('moment');
const fs = require('fs');

const create_storie = async (req, res = response) => {
  let data = req.body;
  try {
    if (req.files) {
      const tempFilePath = req.files.image.tempFilePath;
      const { public_id, secure_url } = await uploadImage(tempFilePath, 'storie');
      const image = { public_id, secure_url };
      fs.unlinkSync(tempFilePath);

      let expiration = moment().add(1, 'day').toDate();

      let reg = await Storie.create({
        description: data.description,
        user: data.user,
        expiration,
        image,
      });

      return res.json({ data: reg });
    }
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const get_stories = async (req, res = response) => {
  try {
    const populate = { path: 'user', select: 'full_name avatar' };
    const friendIds = await User_Friend.distinct('user_friend', { user_origin: req.id });

    const stories = await Storie.find({ user: { $in: [req.id, ...friendIds] } }).populate(populate);
    const today = moment().unix();

    const current_stories = stories.filter((story) => {
      let created_at = moment(story.created_at).unix();
      let expiration = moment(story.created_at).add(1, 'day').unix();
      return today >= created_at && today <= expiration;
    });

    return res.json({ data: current_stories });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

module.exports = {
  create_storie,
  get_stories,
};
