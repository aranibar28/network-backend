const { response } = require('express');
const { uploadImage, deleteImage } = require('../middlewares/cloudinary');
const fs = require('fs');

const Post = require('../models/post');
const Post_Like = require('../models/post_like');
const Post_Comment = require('../models/post_comment');
const User_Friend = require('../models/user_friend');
const Notification = require('../models/notification');
const populate = { path: 'user', select: 'full_name profession avatar.secure_url' };
const populate_friend = { path: 'user_friend', select: 'full_name profession avatar.secure_url' };

const create_post = async (req, res = response) => {
  let data = req.body;
  try {
    if (req.files) {
      const tempFilePath = req.files.image.tempFilePath;
      const { public_id, secure_url } = await uploadImage(tempFilePath, 'post');
      const image = { public_id, secure_url };
      fs.unlinkSync(tempFilePath);
      data.media = image;
    }

    const post = await Post.create(data);
    const reg = await Post.findById(post._id).populate(populate).lean();
    const friends = await User_Friend.find({ user_origin: req.id }).populate(populate_friend).lean();

    send_notification(friends, post, 'Publicación');

    return res.json({ data: reg, friends });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const update_post = async (req, res = response) => {
  let id = req.params['id'];
  let data = req.body;
  try {
    if (req.files) {
      const tempFilePath = req.files.image.tempFilePath;
      const { public_id, secure_url } = await uploadImage(tempFilePath, 'post');
      const image = { public_id, secure_url };
      fs.unlinkSync(tempFilePath);
      data.media = image;
      let old = await Post.findById(id);
      if (old.media && old.media.public_id) {
        await deleteImage(old.media.public_id);
      }
    }

    const reg = await Post.findByIdAndUpdate(id, data, { new: true }).populate(populate).lean();
    const friends = await User_Friend.find({ user_origin: req.id }).populate(populate_friend).lean();

    return res.json({ data: reg, friends });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const read_posts = async (req, res = response) => {
  const id = req.params['id'] || req.id;
  const offset = req.query['offset'];
  const public = req.query['public'];
  const limit = 2;

  try {
    if (public === 'true') {
      const friendIds = await User_Friend.distinct('user_friend', { user_origin: id });
      query = Post.find({ user: { $in: [id, ...friendIds] } }).lean();
    } else {
      query = Post.find({ user: id }).lean();
    }

    const posts = await query
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit + 1)
      .populate(populate);

    const hasMore = posts.length > limit;

    const promises = posts.slice(0, limit).map(async (item) => {
      const [likes, comments] = await Promise.all([
        Post_Like.find({ post: item._id }).populate(populate),
        Post_Comment.find({ post: item._id }).populate(populate),
      ]);

      const arr_comments = comments
        .filter((c) => c.type === 'comment')
        .map((c) => {
          return {
            comment: c,
            replies: comments.filter((r) => r.type === 'reply' && r.reply_id.equals(c._id)),
          };
        });

      const isLiked = likes.some((like) => like.user.equals(req.id));

      return {
        ...item,
        comments: arr_comments,
        likes: likes,
        liked: isLiked,
      };
    });

    const reg = await Promise.all(promises);

    return res.json({ data: reg, hasMore });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const read_posts_with_media = async (req, res = response) => {
  const id = req.params['id'] || req.id;

  try {
    query = Post.find({ user: id, media: { $exists: true } });
    const posts = await query.sort({ created_at: -1 }).populate(populate).lean();

    const promises = posts.map(async (item) => {
      const [likes, comments] = await Promise.all([
        Post_Like.find({ post: item._id }).populate(populate),
        Post_Comment.find({ post: item._id }).populate(populate),
      ]);

      const arr_comments = comments
        .filter((c) => c.type === 'comment')
        .map((c) => {
          return {
            comment: c,
            replies: comments.filter((r) => r.type === 'reply' && r.reply_id.equals(c._id)),
          };
        });

      const isLiked = likes.some((like) => like.user.equals(req.id));

      return {
        ...item,
        comments: arr_comments,
        likes: likes,
        liked: isLiked,
      };
    });

    const reg = await Promise.all(promises);

    return res.json({ data: reg });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const read_post_by_id = async (req, res = response) => {
  const post_id = req.params['post'];

  try {
    const post = await Post.findById(post_id).populate(populate).lean();

    if (!post) {
      return res.json({ msg: 'Post not found' });
    }

    const [likes, comments] = await Promise.all([
      Post_Like.find({ post: post._id }).populate(populate),
      Post_Comment.find({ post: post._id }).populate(populate),
    ]);

    const arr_comments = comments
      .filter((c) => c.type === 'comment')
      .map((c) => {
        return {
          comment: c,
          replies: comments.filter((r) => r.type === 'reply' && r.reply_id.equals(c._id)),
        };
      });

    const isLiked = likes.some((like) => like.user.equals(req.id));

    const reg = {
      ...post,
      comments: arr_comments,
      likes: likes,
      liked: isLiked,
    };

    return res.json({ data: reg });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const delete_post = async (req, res = response) => {
  const id = req.params['id'];
  try {
    const reg = await Post.findByIdAndRemove(id).populate(populate).lean();
    const friends = await User_Friend.find({ user_origin: req.id }).populate(populate_friend).lean();

    if (reg.media?.public_id) {
      await deleteImage(reg.media.public_id);
    }

    await Promise.all([
      Post_Comment.deleteMany({ post: reg._id }),
      Post_Like.deleteMany({ post: reg._id }),
      Notification.deleteMany({ post: reg._id }),
    ]);

    return res.json({ data: reg, friends });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const set_like_post = async (req, res = response) => {
  const user = req.id;
  const { post } = req.body;
  let reg;

  try {
    const existing = await Post.findById(post);
    if (!existing) {
      return res.json({ msg: 'Publicación no encontrada' });
    }

    let liked = await Post_Like.findOne({ user, post });
    let status = true;
    if (!liked) {
      const like = await Post_Like.create({ user, post });
      reg = await Post_Like.findById(like._id).populate(populate).lean();
      status = true;
    } else {
      reg = await Post_Like.findByIdAndRemove(liked._id).populate(populate).lean();
      status = false;
    }
    return res.json({ data: reg, status });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const set_comment_post = async (req, res = response) => {
  const data = req.body;
  try {
    data.user = req.id;

    const comment = await Post_Comment.create(data);
    const reg = await Post_Comment.findById(comment._id).populate(populate).lean();
    const friends = await User_Friend.find({ user_origin: req.id }).populate(populate_friend).lean();

    send_notification(friends, reg.post, 'Comentario');

    return res.json({ data: reg, friends });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const get_notifications = async (req, res = response) => {
  const id = req.id;
  try {
    const reg = await Notification.find({ user: id }).sort({ created_at: -1 }).limit(10).populate({
      path: 'origin',
      select: 'full_name profession avatar.secure_url',
    });

    return res.json({ data: reg });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

const select_notification = async (req, res = response) => {
  const id = req.params['id'];
  try {
    let reg = await Notification.findByIdAndUpdate(id, { status: true }, { new: true });
    return res.json({ data: reg });
  } catch (error) {
    return res.json({ msg: error.message });
  }
};

// Auxliar functions
const send_notification = async (friends, post, type) => {
  let description = '';
  if (type === 'Publicación') {
    description = 'ha creado una nueva publicación.';
  } else if (type === 'Comentario') {
    description = 'ha dejado un nuevo comentario.';
  }

  const notifications = friends.map((item) => ({
    type,
    description,
    origin: item.user_origin._id,
    user: item.user_friend._id,
    post: post._id,
  }));

  await Notification.insertMany(notifications);
};

const get_posts = async (id, offset, public) => {
  let query;

  if (public === 'true') {
    const friendIds = await User_Friend.distinct('user_friend', { user_origin: id });
    query = Post.find({ user: { $in: [id, ...friendIds] } }).lean();
  } else {
    query = Post.find({ user: id }).lean();
  }

  const posts = await query.sort({ created_at: -1 }).skip(offset).limit(2).populate(populate);

  return posts;
};

module.exports = {
  create_post,
  update_post,
  read_posts,
  read_posts_with_media,
  read_post_by_id,
  delete_post,
  set_like_post,
  set_comment_post,
  get_notifications,
  select_notification,
};
