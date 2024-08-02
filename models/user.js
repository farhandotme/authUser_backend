const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/practiceUserAuth");

const userSchema = mongoose.Schema(
  {
    name: String,
    username: String,
    email: String,
    age: Number,
    password: String,
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);
