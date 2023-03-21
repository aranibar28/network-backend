const { Schema, model } = require("mongoose");
const { timestamps } = require("../utils/data")

const Post_CommentSchema = Schema(
   {
      user:     { type: Schema.Types.ObjectId, required: true, ref: "User" },
      post:     { type: Schema.Types.ObjectId, required: true, ref: "Post" },
      reply_id: { type: Schema.Types.ObjectId, required: false, ref: "Post_Comment" },
      comment:  { type: String, required: true },
      type:     { type: String, required: true },
   },
   timestamps
);

Post_CommentSchema.method("toJSON", function () {
   const { __v, ...object } = this.toObject();
   return object;
});

module.exports = model("Post_Comment", Post_CommentSchema);
