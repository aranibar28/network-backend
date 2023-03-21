const { Schema, model } = require("mongoose");
const { timestamps } = require("../utils/data")

const PostSchema = Schema(
   {
      user:        { type: Schema.Types.ObjectId, required: true, ref: "User" },
      description: { type: String, required: true },
      privacy:     { type: String, required: true },
      media:       { type: Object, required: false },
   },
   timestamps
);

PostSchema.method("toJSON", function () {
   const { __v, ...object } = this.toObject();
   return object;
});

module.exports = model("Post", PostSchema);
