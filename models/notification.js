const { Schema, model } = require('mongoose');
const { timestamps } = require('../utils/data');

const NotificationSchema = Schema(
  {
    type:        { type: String, required: true },
    description: { type: String, required: true },
    status:      { type: Boolean, required: true, default: false },
    user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    origin:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post:        { type: Schema.Types.ObjectId, ref: 'Post', required: false },
    user_friend: { type: Schema.Types.ObjectId, ref: 'User_Friend', required: false },
  },
  timestamps,
);

NotificationSchema.method('toJSON', function () {
  const { __v, ...object } = this.toObject();
  return object;
});

module.exports = model('Notification', NotificationSchema);
