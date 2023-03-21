const { response } = require('express');
const { titleCase } = require('../utils/functions');
const { ObjectId } = require('mongoose').Types;

const Post = require('../models/post');
const User = require('../models/user');
const User_Friend = require('../models/user_friend');
const User_Invitation = require('../models/user_invitation');

const jwt = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const generator = require('unique-username-generator');
const populate = { path: 'user_friend', select: 'full_name profession avatar.secure_url' };

const login_user = async (req, res = response) => {
  const { email, password } = req.body;
  try {
    let data = await User.findOne({ email });
    if (!data) {
      return res.json({ msg: 'El correo o la contraseña son incorrectos.' });
    } else {
      let valid_password = bcrypt.compareSync(password, data.password);
      if (!valid_password) {
        return res.json({ msg: 'El correo o la contraseña son incorrectos.' });
      } else {
        let token = await jwt.createToken(data);
        return res.json({ data, token });
      }
    }
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const refresh_token = async (req, res = response) => {
  const id = req.id;

  try {
    const [user, payload] = await Promise.all([User.findById(id).lean(), get_payload(id, req.id)]);
    const token = await jwt.createToken(user);

    if (!user) {
      return res.json({ msg: 'Usuario no encontrado.' });
    }

    return res.json({ data: { ...user, ...payload }, token });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const create_user = async (req, res = response) => {
  const data = req.body;
  try {
    let exist_email = await User.findOne({ email: data.email });
    if (exist_email) {
      return res.json({ msg: 'Este correo ya se encuentra registrado.' });
    }
    data.full_name = titleCase(data.first_name, data.last_name);
    data.password = bcrypt.hashSync(data.password, bcrypt.genSaltSync());
    data.user_name = '@' + generator.generateFromEmail(data.email, 3);
    let reg = await User.create(data);
    let token = await jwt.createToken(reg);
    return res.json({ data: reg, token });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const update_user = async (req, res = response) => {
  let id = req.params['id'];
  const { password, ...data } = req.body;
  try {
    if (password) {
      data.password = bcrypt.hashSync(password, bcrypt.genSaltSync());
    }

    data.full_name = titleCase(data.first_name, data.last_name);

    const [user, payload] = await Promise.all([
      User.findByIdAndUpdate(id, data, { new: true }),
      get_payload(id, req.id),
    ]);

    return res.json({ data: { ...user, ...payload } });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const update_password = async (req, res = response) => {
  let id = req.params['id'];
  const { current, password } = req.body;
  try {
    let user = await User.findById(id);

    let valid_password = bcrypt.compareSync(current, user.password);

    if (!valid_password) {
      return res.json({ msg: 'El password actual no es correcto.' });
    }

    let new_password = bcrypt.hashSync(password, bcrypt.genSaltSync());
    let reg = await User.findByIdAndUpdate(id, { password: new_password }, { new: true });
    return res.json({ data: reg });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const delete_user = async (req, res = response) => {
  let id = req.params['id'];
  try {
    let reg = await User.findByIdAndRemove(id);
    return res.json({ data: reg });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const validate_email = async (req, res = response) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.json({ msg: 'El correo no existe.' });
    }

    const min = 1000;
    const max = 9999;

    const recover = Math.floor(Math.random() * (max - min + 1) + min).toString();
    await User.findByIdAndUpdate(user._id, { recover });

    return res.json({ data: user });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const read_users = async (req, res = response) => {
  const id = req.id;
  const search = req.query['search'] || '';
  try {
    let pipeline = [
      {
        $match: {
          _id: { $ne: ObjectId(id) },
          $or: [{ first_name: { $regex: search, $options: 'i' } }, { last_name: { $regex: search, $options: 'i' } }],
        },
      },
      {
        $lookup: {
          from: 'user_friends',
          localField: '_id',
          foreignField: 'user_friend',
          as: 'friends',
        },
      },
      {
        $lookup: {
          from: 'user_invitations',
          localField: '_id',
          foreignField: 'user_destiny',
          as: 'invitations1',
        },
      },
      {
        $lookup: {
          from: 'user_invitations',
          localField: '_id',
          foreignField: 'user_origin',
          as: 'invitations2',
        },
      },
      {
        $addFields: {
          isFriend: { $in: [ObjectId(id), '$friends.user_origin'] },
          isInvited: { $in: [ObjectId(id), '$invitations1.user_origin'] },
          hasInvitation: { $in: [ObjectId(id), '$invitations2.user_destiny'] },
        },
      },
      {
        $project: {
          _id: 1,
          full_name: 1,
          avatar: 1,
          email: 1,
          isFriend: 1,
          isInvited: 1,
          hasInvitation: 1,
        },
      },
      {
        $sort: { full_name: 1 },
      },
    ];

    let users = await User.aggregate(pipeline);

    return res.json({ data: users });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const read_user_by_id = async (req, res = response) => {
  const id = req.params['id'];
  try {
    const [user, payload] = await Promise.all([User.findById(id).lean(), get_payload(id, req.id)]);

    return res.json({
      ...user,
      ...payload,
    });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const get_payload = async (id, sub) => {
  const pipeline = [
    { $lookup: { from: 'users', localField: 'user_friend', foreignField: '_id', as: 'user_friend' } },
    { $unwind: '$user_friend' },
    {
      $project: {
        user_origin: 1,
        'user_friend._id': 1,
        'user_friend.full_name': 1,
        'user_friend.profession': 1,
        'user_friend.email': 1,
        'user_friend.avatar': 1,
      },
    },
  ];

  const [posts, friends, invitations] = await Promise.all([
    Post.countDocuments({ user: id }),
    User_Friend.aggregate([{ $match: { user_origin: ObjectId(id) } }, ...pipeline]),
    User_Invitation.aggregate([{ $match: { $or: [{ user_origin: ObjectId(id) }, { user_destiny: ObjectId(id) }] } }]),
  ]);

  const isFriend = friends.some((element) => element.user_friend._id.toString() === sub);
  const isInvited = invitations.some((element) => element.user_destiny.toString() === id && element.user_origin.toString() === sub);
  const hasInvitation = invitations.some((element) => element.user_origin.toString() === id && element.user_destiny.toString() === sub);

  return {
    posts,
    friends,
    isFriend,
    isInvited,
    hasInvitation,
  };
};

const get_users_random = async (req, res = response) => {
  const id = req.id;

  try {
    // Buscar todas las solicitudes enviadas y recibidas por el usuario actual
    const userInvitations = await User_Invitation.find({
      $or: [{ user_origin: id }, { user_destiny: id }],
    });

    // Buscar todas las amistades del usuario actual
    const userFriends = await User_Friend.find({ user_origin: id });

    // Obtener la lista de IDs de amigos y solicitudes de amistad del usuario actual
    const friendIds = userFriends.map((friend) => friend.user_friend.toString());
    const invitationIds = userInvitations.map((invitation) => {
      if (invitation.user_origin.equals(id)) {
        return invitation.user_destiny.toString();
      } else {
        return invitation.user_origin.toString();
      }
    });

    const friendAndInvitationIds = [...friendIds, ...invitationIds, id];

    // Buscar usuarios que no sean amigos ni hayan recibido o enviado solicitudes de amistad
    const users = await User.find({
      _id: { $nin: friendAndInvitationIds },
    }).limit(5);

    return res.json({ data: users });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const get_users_friends = async (req, res = response) => {
  const id = req.params['id'] || req.id;

  try {
    const reg = await User_Friend.find({ user_origin: id }).populate(populate).lean();

    for (let item of reg) {
      item.user_friend.friends = await User_Friend.countDocuments({ user_origin: item.user_friend._id });
    }

    return res.json({ data: reg });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const delete_friend = async (req, res = response) => {
  const id = req.params['id'];
  try {
    let friends = await User_Friend.find({ user_origin: id }).populate(populate);
    let reg = await User_Friend.findOneAndRemove({ user_origin: req.id, user_friend: id });
    await User_Friend.findOneAndRemove({ user_origin: id, user_friend: req.id });

    return res.json({ data: reg, friends });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

module.exports = {
  create_user,
  read_users,
  read_user_by_id,
  update_user,
  update_password,
  delete_user,
  login_user,
  refresh_token,
  validate_email,
  get_users_random,
  get_users_friends,
  delete_friend,
};
