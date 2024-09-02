const express = require("express");
const app = express();
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/bookmanager");
const db = mongoose.connection;
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const bodyParser = require("body-parser");
app.use(
  cors({
    origin: "http://localhost:5500",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
db.on("connected", () => {
  console.log("CONNECTED TO MONGODB SERVER");
});
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  id: Number,
});
const User = mongoose.model("User", userSchema);
const bookSchema = new mongoose.Schema({
  id: Number,
  Title: String,
  Description: String,
  Author: String,
});
const Book = mongoose.model("Book", bookSchema);
// app.post("/auth/signup", async (req, res) => {
//   const { username, password, email, id } = req.body;
//   const s = new User({
//     username: username,
//     password: password,
//     email: email,
//     id: id,
//   });
//   const a = await s.save();
//   res.send(a);
// });
app.post("/auth/signup", async (req, res) => {
  const { username, password, email, id } = req.body;
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      username: username,
      password: hashedPassword,
      email: email,
      id: id,
    });
    const savedUser = await newUser.save();
    res.send(savedUser);
  } catch (err) {
    res.status(500).send("Error signing up");
  }
});

// app.post("/auth/login", async (req, res) => {
//   const { username, password } = req.body;
//   const a = await User.findOne({ username: username });
//   if (a && password == a.password) {
//     return res.send("logged in successful");
//   } else {
//     return res.send("invalid credentials.");
//   }
// });
//yo hjo ko code
// app.post("/auth/login", async (req, res) => {
//   const { username, password } = req.body;
//   const user = await User.findOne({ username: username });
//   if (user) {
//     console.log(user);
//     // Compare the hashed password
//     const match = await bcrypt.compare(password, user.password);

//     if (match) {
//       res.send("Logged in successfully");
//     } else {
//       res.status(401).send("Invalid credentials");
//     }
//   } else {
//     res.status(401).send("Invalid credentials");
//   }
// });
//yaata aja ko
app.post("/auth/logout", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.send("Login first!");
  res.cookie("token", token, {
    httpOnly: true, // Helps mitigate cross-site scripting (XSS) attacks
    maxAge: 0, // 1 hour
  });
  res.json({ message: "Logged out successfully" });
});
app.post("/auth/login", async (req, res) => {
  const token = req.cookies.token;
  if (token) return res.send("Already logged in");
  const { username, password } = req.body;
  const user = await User.findOne({ username: username });
  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, username: user.username },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.cookie("token", token, {
        httpOnly: true, // Helps mitigate cross-site scripting (XSS) attacks
        maxAge: 60 * 60 * 1000, // 1 hour
      });
      res.json({ message: "Logged in successfully", token });
    } else {
      res.status(401).send("Invalid credentials");
    }
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).send("Access Denied");

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
    req.user = user;
    next();
  });
};
//naya book thapnako lai
app.post("/book", async (req, res) => {
  const { id, Title, Description, Author } = req.body;
  const s = new Book({
    id: id,
    Title: Title,
    Description: Description,
    Author: Author,
  });
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
  });
  const a = await s.save();
  res.send(a);
});
// boook find garna ko lai
app.get("/book/find/:id", async (req, res) => {
  const result = req.params.id;
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
  });
  var store = await Book.findOne({ _id: result });
  res.send(store);
});
//delete ko lagii yo book
app.delete("/book/delete/:id", async (req, res) => {
  const result = req.params.id;
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
  });
  var store = await Book.deleteOne({ _id: result });
  res.send(store);
});
//update ko lai
app.put("/book/:id", async (req, res) => {
  const result = req.params.id;
  var store = await Book.updateOne(
    { _id: result },
    {
      id: req.body.id,
      Title: req.body.Title,
      Description: req.body.Description,
      Author: req.body.Author,
    }
  );
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
  });
  res.send(store);
});
//sabai ko list show garna lai
app.get("/book/list", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
  });

  const val = await Book.find();
  res.send(val);
});

///
const logRequest = (req, res, next) => {
  console.log(
    `${new Date().toLocaleString()} Request made to: ${req.originalUrl}`
  );
  next();
};
///userlist nikalna ko lai
app.get("/userr", logRequest, async (req, res) => {
  const val = await User.find();
  res.send(val);
});
const Middleware = async (req, res, next) => {
  const result = req.params.id;
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
  });

  var store = await Book.findOne({ _id: result });
  req.book = store;
  next();
};
// app.get("/man/:id", Middleware, async (req, res) => {
//   res.send(req.book);
// });
const middleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    res.send(`invalid token`);
  }
  jwt.verify(token, JWT_SECRET, (err, data) => {
    if (err) return res.send(`invalid token`);
    req.user = data;
    next();
  });
};

app.get("/profile", middleware, async (req, res) => {
  const userId = req.user.id;
  var store = await User.findOne({ _id: userId });
  res.send(store);
});
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username });
  if (user) {
    if (password == user.password) {
      const token = jwt.sign(
        { id: user._id, username: user.username },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.cookie("token", token, {
        httpOnly: true, // Helps mitigate cross-site scripting (XSS) attacks
        maxAge: 60 * 60 * 1000, // 1 hour
      });
      res.json({ message: "Login successful", token });
      // res.redirect("http://localhost:5500/index.html");
    } else {
      return res.status(400).json({ message: "Invalid username or password" });
    }
  }
});

app.listen(3000, () => {
  console.log("listening to port 3000");
});
