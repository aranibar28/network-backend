const User = require('../models/user');
const User_Friend = require('../models/user_friend');
const populate = { path: 'user_friend', select: 'full_name profession avatar.secure_url' };

const { uploadImage, deleteImage } = require('../middlewares/cloudinary');
const fs = require('fs');

const upload_image = async (req, res = response) => {
  const id = req.params['id'];
  const { type, description } = req.body;

  try {
    if (req.files) {
      const tempFilePath = req.files.image.tempFilePath;
      const { public_id, secure_url } = await uploadImage(tempFilePath, 'gallery');
      const image = { public_id, secure_url, description };
      fs.unlinkSync(tempFilePath);

      let old = await User.findById(id); // obtener el registro anterior
      let reg = await User.findByIdAndUpdate(id, { [type]: image }, { new: true });
      let friends = await User_Friend.find({ user_origin: id }).populate(populate);

      if (old[type] && old[type].public_id) {
        await deleteImage(old[type].public_id); // eliminar la imagen anterior
      }
      reg.friends = friends;
      return res.json({ data: reg });
    } else {
      let update = { $set: { [`${type}.description`]: description } };

      const [reg, friends] = await Promise.all([
        User.findByIdAndUpdate(id, update, { new: true }),
        User_Friend.find({ user_origin: id }).populate(populate),
      ]);

      reg.friends = friends;
      return res.json({ data: reg });
    }
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

module.exports = {
  upload_image,
};
