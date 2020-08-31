const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");


mongoose.connect("mongodb://localhost:27017/secretsDB", {useNewUrlParser: true});
const UserSchema = new mongoose.Schema({
  email: String,
  password: String
});

/////////////for the encryption part-- level 2///////////////
const secretString = "This is just t do encrytion";
// You can either use a single secret string of any length; or a pair of base64 strings (a 32-byte encryptionKey and a 64-byte signingKey).
// right now we are using secret string.

// if we do not specify any particular fiels it will encrypt all the data, which is not good.
UserSchema.plugin(encrypt,{secret: secretString, encryptedFields: ['password']});
////////Successfully we have incorporated encrytion!!!!! ////////////////
//////in mongoose encryption starts at save() and decryption starts at find() ///////////////////

const UserModel = mongoose.model("User",UserSchema);


//home//
app.get("/",function(req,res){
  res.render("home");
});

//login//
app.get("/login",function(req,res){
  res.render("login");
});

//register//
app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register", function(req,res){
  const user = new UserModel({
    email: req.body.username,
    password: req.body.password
  });
  user.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  });
});


 // Level 1 security- by just authenticating username and password ///

app.post("/login",function(req,res){
  const loginEmail = req.body.username;
  console.log(loginEmail);
  const loginPassword = req.body.password;
  console.log(loginPassword);

  UserModel.findOne({email: loginEmail},function(err,foundUser){
  if(err){
    console.log(err);
  }else{
    if(foundUser){
      if(foundUser.password === loginPassword){
        res.render("secrets");
      }else{
        res.send("not found");
      }
    }else{
      res.send("not found");
    }
  }
  });
});

app.listen("3000",function(){
  console.log("Server started at port 3000");
});
