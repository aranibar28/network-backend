const { Schema, model } = require("mongoose");
const { timestamps } = require("../utils/data")

const UserSchema = Schema(
   {
      email:       { type: String, required: true, unique: true },
      password:    { type: String, required: true },
      first_name:  { type: String, required: true },
      last_name:   { type: String, required: true },
      full_name:   { type: String, required: false },
      user_name:   { type: String, required: false },
      description: { type: String, required: false },
      profession:  { type: String, required: false },
      country:     { type: String, required: false },
      phone:       { type: String, required: false },
      genre:       { type: String, required: false },
      birthday:    { type: String, required: false },
      recover:     { type: String, required: false },
      friends:     { type: Array, required: false, default: [] },
      avatar:      { type: Object, required: false, default: {} },
      banner:      { type: Object, required: false, default: {} },
      status:      { type: Boolean, required: true, default: true },
   },
   timestamps
);

UserSchema.method("toJSON", function () {
   const { __v, ...object } = this.toObject();
   return object;
});

module.exports = model("User", UserSchema);
