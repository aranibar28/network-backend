const { Schema, model } = require("mongoose");
const { timestamps } = require("../utils/data")

const Post_LikeSchema = Schema(
   {
      user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
      post: { type: Schema.Types.ObjectId, required: true, ref: "Post" },
   },
   timestamps
);

Post_LikeSchema.method("toJSON", function () {
   const { __v, ...object } = this.toObject();
   return object;
});

module.exports = model("Post_Like", Post_LikeSchema);
