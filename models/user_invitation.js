const { Schema, model } = require("mongoose");
const { timestamps } = require("../utils/data")

const User_InvitationSchema = Schema(
   {
      user_origin:  { type: Schema.Types.ObjectId, required: true, ref: "User" },
      user_destiny: { type: Schema.Types.ObjectId, required: true, ref: "User" },
   },
   timestamps
);

User_InvitationSchema.method("toJSON", function () {
   const { __v, ...object } = this.toObject();
   return object;
});

module.exports = model("User_Invitation", User_InvitationSchema);
