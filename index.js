const express = require("express");
const session = require("express-session");
const mysql = require("mysql");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const saltRounds = 10;
const port = 3001;
const secretKey = "vanitas";

const app = express();
app.use(cors());

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cargo",
});

app.get("/test", (req, res) => {
  res.send({ status: "200" });
});

app.post("/registed", (req, res) => {
  const userId = req.body.userId;
  const firstName = req.body.firstname;
  const lastName = req.body.lastname;
  const phoneNum = req.body.phone;
  const email = req.body.email;
  const password = req.body.password;
  const confpassword = req.body.confpassword;

  if (password !== confpassword) {
    return res.status(400).send({
      status: 400,
      msg: "Password and Confrim Password do not match",
    });
  } else {
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err) {
        console.log(err);
      }
      if (hash) {
        connection.query(
          "INSERT INTO account (userId , password) VALUES (?,?)",
          [userId, hash],
          (err, result) => {
            if (err) {
              console.log(err);
            }
            if (result) {
              res.send({ status: 200, msg: "Registeration Successfully" });
            }
          }
        );
        connection.query(
          "INSERT INTO account_info (userId , firstName , lastName , email , phoneNum) VALUES (?,?,?,?,?)",
          [userId, firstName, lastName, email, phoneNum],
          (err, result) => {}
        );
      }
    });
  }
  //   console.log(req.body);
});

app.post("/logged", (req, res) => {
  const userId = req.body.userId;
  const password = req.body.password;

  if (userId && password) {
    connection.query(
      "SELECT * FROM account WHERE userId = ?",
      [userId],
      (err, users) => {
        if (err) {
          res.send({ err: err });
        }
        if (users.length > 0) {
          bcrypt.compare(password, users[0].password, function (err, result) {
            if (result) {
              const token = jwt.sign({ userId: users[0].userId }, secretKey, {
                expiresIn: "1h",
              });
              res.json({ status: 200, msg: "Logging successfully !", token });
            } else {
              res.json({
                status: 404,
                msg: "Wrong email/password combination!",
              });
            }
          });
        } else {
          res.send({ status: 404, msg: "Wrong email combination!" });
        }
      }
    );
  } else {
    res.send("Please enter Username and Password!");
  }
});

app.post("/authen", (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, secretKey);
    res.json({ status: 200, msg: "Verified" ,decoded});
  } catch (error) {
    res.json({ status: 404, msg: "Failed" });
  }
});

app.listen(port, () => {
  console.log(`This app listening on port ${port}`);
});
