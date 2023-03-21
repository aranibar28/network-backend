const { Schema, model } = require("mongoose");
const { timestamps } = require("../utils/data")

const StorieSchema = Schema(
   {
      user:        { type: Schema.Types.ObjectId, required: true, ref: "User" },
      image:       { type: Object, required: true },
      description: { type: String, required: false },
      expiration:  { type: Date, required: false },
   },
   timestamps
);

StorieSchema.method("toJSON", function () {
   const { __v, ...object } = this.toObject();
   return object;
});

module.exports = model("Storie", StorieSchema);
