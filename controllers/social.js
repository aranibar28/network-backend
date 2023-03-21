const { response } = require('express');

const User_Invitation = require('../models/user_invitation');
const User_Friend = require('../models/user_friend');

const send_invitation_friend = async (req, res = response) => {
  const data = req.body;
  try {
    data.user_origin = req.id;
    let reg = await User_Invitation.create(data);
    return res.json({ data: reg });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const select_invitation_friend = async (req, res = response) => {
  const { id, type } = req.body;
  try {
    if (type === 'delete') {
      let reg = await User_Invitation.findByIdAndRemove(id);
      return res.json({ data: reg });
    } else if (type == 'accept') {
      let user = await User_Invitation.findById(id);
      addFriend(req.id, user.user_origin);
      addFriend(user.user_origin, req.id);
      let reg = await User_Invitation.findByIdAndRemove(id);
      return res.json({ data: reg });
    }
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const select_invitations_friends = async (req, res = response) => {
  const { id, type } = req.body;
  try {
    if (type === 'agregar') {
      let reg = await User_Invitation.create({ user_origin: req.id, user_destiny: id });
      return res.json({ data: reg });
    } else if (type == 'anular') {
      let reg = await User_Invitation.findOneAndRemove({ user_origin: req.id, user_destiny: id });
      return res.json({ data: reg });
    } else if (type == 'eliminar') {
      await User_Friend.findOneAndRemove({ user_origin: req.id, user_friend: id });
      await User_Friend.findOneAndRemove({ user_origin: id, user_friend: req.id });
      const reg = { user_origin: req.id, user_destiny: id };
      return res.json({ data: reg });
    } else if (type == 'reject') {
      let reg = await User_Invitation.findOneAndRemove({ user_origin: id, user_destiny: req.id });
      return res.json({ data: reg });
    } else if (type == 'accept') {
      addFriend(req.id, id);
      addFriend(id, req.id);
      let reg = await User_Invitation.findOneAndRemove({ user_origin: id, user_destiny: req.id });
      return res.json({ data: reg });
    }
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const addFriend = async (user_origin, user_friend) => {
  try {
    await User_Friend.create({ user_origin, user_friend });
  } catch (error) {
    throw new Error('Error al aceptar invitación.');
  }
};

const get_invitations = async (req, res = response) => {
  const id = req.id;
  const limited = req.params['limited'];
  try {
    if (limited) {
      let invitations = await User_Invitation.find({ user_destiny: id })
        .populate('user_origin')
        .limit(5)
        .sort({ created_at: -1 });
      return res.json({ data: invitations });
    } else {
      let invitations = await User_Invitation.find({ user_destiny: id })
        .populate('user_origin')
        .sort({ created_at: -1 });
      return res.json({ data: invitations });
    }
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

module.exports = {
  send_invitation_friend,
  select_invitation_friend,
  select_invitations_friends,
  get_invitations,
};
