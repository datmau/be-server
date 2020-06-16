const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  skills: [
    {
      name: String,
      messages: [{ username: String, message: String, updatedAt: Date }],
    },
  ],
  role: {
    type: String,
    default: "employee",
    enum: ["employee", "admin"],
  },
  token: {
    type: String,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
