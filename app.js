
//dotenv//
//dotenv allows you to separate secrets from your source code.
// This is useful in a collaborative environment (e.g., work, or open source) where you may not want to share
// your database login credentials with other people.
// Instead, you can share the source code while allowing other people to create their own . env file.

// .env is a hidden file, which we need to create in the rot of project folder.

require('dotenv').config();


const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose")

// const encrypt = require("mongoose-encryption"); -- now we'll use level4 encryption
// i.e hash using md5, that is why we're commenting.
// This is only for level2 and level3.

// const md5 = require("md5"); thsi also we commented for level5 security
// i.e hashing with salting

const bcrypt = require("bcrypt");
const saltRounds = 10;

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
// const secretString = "This is just to do encrytion";
// You can either use a single secret string of any length; or a pair of base64 strings (a 32-byte encryptionKey and a 64-byte signingKey).
// right now we are using secret string.

// if we do not specify any particular fiels it will encrypt all the data, which is not good.
// UserSchema.plugin(encrypt,{secret: secretString, encryptedFields: ['password']});
////////Successfully we have incorporated encrytion!!!!! ////////////////
//////in mongoose encryption starts at save() and decryption starts at find() ///////////////////

//LEVEL 3 encryption --using env variable //////////////////////////////////////////////////////
//We are commenting level 2 encryption method for now //
// We'll again comment it for executing level 4 encryption.

// console.log(process.env.SECRET_STRING);
// UserSchema.plugin(encrypt,{secret: process.env.SECRET_STRING, encryptedFields:["password"]});

/////////////////////////////////////////////////

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
// console.log(md5(123456));
app.post("/register", function(req,res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    //This function will generate hash with salting.
    const user = new UserModel({
      email: req.body.username,
      // password: md5(req.body.password)
      password: hash
    });
    user.save(function(err){
      if(err){
        console.log(err);
      }else{
        res.render("secrets");
      }
    });
});
});


 // Level 1 security- by just authenticating username and password ///
//level 4 security - using md5 by just passing it like below //
//level 5 security- here we're using salting with hashing .
app.post("/login",function(req,res){
  const loginEmail = req.body.username;
  console.log(loginEmail);
  // const loginPassword = md5(req.body.password);
  const loginPassword = req.body.password;
  console.log(loginPassword);

  UserModel.findOne({email: loginEmail},function(err,foundUser){
  if(err){
    console.log(err);
  }else{
    if(foundUser){
      bcrypt.compare(loginPassword, foundUser.password, function(err, result) {
       if(result ===true ){
         res.render("secrets");
       }else{
         res.send("not found");
       }
});
    //   if(foundUser.password === loginPassword){
    //     res.render("secrets");
    //   }else{
    //     res.send("not found");
    //   }
    }else{
      res.send("not found");
    }
  }
  });
});

app.listen("3000",function(){
  console.log("Server started at port 3000");
});
