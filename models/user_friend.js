const { Schema, model } = require("mongoose");
const { timestamps } = require("../utils/data")

const User_FriendSchema = Schema(
   {
      user_origin: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      user_friend: { type: Schema.Types.ObjectId, required: true, ref: "User" },
   },
   timestamps
);

User_FriendSchema.method("toJSON", function () {
   const { __v, ...object } = this.toObject();
   return object;
});

module.exports = model("User_Friend", User_FriendSchema);
