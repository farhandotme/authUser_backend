const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path")

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/register", async (req, res) => {
  let { name, username, email, age, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.send("User Already Exists");
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      let createdUser = userModel.create({
        name,
        username,
        email,
        age,
        password: hash,
      });
      let token = jwt.sign({ email: email, userid: createdUser._id }, "secret");
      res.cookie("token", token);
      res.render("usersuccess");
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/edit/:id", isloggedin, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  res.render("edit", { post });
});

app.post("/update/:id", isloggedin, async (req, res) => {
  let post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content }
  );
  res.redirect("/profile");
});

app.post("/login", async (req, res) => {
  let user = await userModel.findOne({ email: req.body.email });
  if (!user) return res.send("something went wrong");
  bcrypt.compare(req.body.password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign(
        { email: req.body.email, userid: user._id },
        "secret"
      );
      res.cookie("token", token);
      res.redirect("/profile");
    } else {
      res.send("Something went wrong");
    }
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isloggedin, async (req, res) => {
  const user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("profile", { user });
});

app.post("/post", isloggedin, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let posts = await postModel.create({
    user: user._id,
    content: req.body.content,
  });
  user.posts.push(posts._id);
  await user.save();
  res.redirect("/profile");
});

function isloggedin(req, res, next) {
  if (req.cookies.token === "") {
    res.redirect("/login");
  } else {
    let data = jwt.verify(req.cookies.token, "secret");
    req.user = data;
    next();
  }
}

app.listen(3000);
