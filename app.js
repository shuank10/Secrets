
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

///////step -1   level 6 -- now we are using cookies and sessions for authentication ////////
////for this we need to install these below package //////////////

const session = require("express-session");
const passport = require("passport");
const passportlocalMongoose = require("passport-local-mongoose");
//we don't need to require passport-local as it will already incorporated in pasport-local--mongoose. //
////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////Google-OAuth//////////////////////////////////////////////////////////
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
//////////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");
///////// step -2  level -6 /////////////////////////////////////////////////////////////////////////////////////////////////
///this session shoule be place here only, that is after all app.uses, and just before the mongosse db connection //
app.use(session({
  secret: process.env.SECRET,
  resave: false,
 saveUninitialized: true,
}));
// step -3 session setup is done///////////////////////////////////////////////////////////////////////////////////////////

app.use(passport.initialize());
//to initiaize yhe passport//////
app.use(passport.session());
//to use passport to set a session///
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


mongoose.connect("mongodb://localhost:27017/secretsDB", {useNewUrlParser: true});
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
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

/////////// step -4  Level 6 - passport and session/cookies //////////

UserSchema.plugin(passportlocalMongoose);
///////////////////////////////////////////////////////////
/////////////Google-OAuth///////////////
UserSchema.plugin(findOrCreate);
///////////////////////////////////////
const UserModel = mongoose.model("User",UserSchema);

/////////////// step -5   level 6 /////////////////////////////////
passport.use(UserModel.createStrategy());

// passport.serializeUser(UserModel.serializeUser());
// passport.deserializeUser(UserModel.deserializeUser());
// better to use this passport serialization which will work in all conditions, as the
//above will fail in google oauth
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  UserModel.findById(id, function(err, user) {
    done(err, user);
  });
});
//////////////////////////////////////////////////////

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    UserModel.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//home//
app.get("/",function(req,res){
  res.render("home");
});

///////google-OAuth/////////////////////////////////////////////////////////////////////
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

////this one is routing for Cannot GET /auth/google/secrets


app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect("/secrets");
  });
  /////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//login//
app.get("/login",function(req,res){
  res.render("login");
});

//register//
app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets")
  }else{
    res.redirect("/login");
  }
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

// console.log(md5(123456));
app.post("/register", function(req,res){

//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     // Store hash in your password DB.
//     //This function will generate hash with salting.
//     const user = new UserModel({
//       email: req.body.username,
//       // password: md5(req.body.password)
//       password: hash
//     });
//     user.save(function(err){
//       if(err){
//         console.log(err);
//       }else{
//         res.render("secrets");
//       }
//     });
// });

///////////////level 6 - handling the request ///////////////////////
UserModel.register({username: req.body.username},req.body.password,function(err,registeredUser){
  ///this username should always be thre, don't change /////
  if(err){
    console.log(err);
    res.redirect("/");
  }else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    });
  }
});



});


 // Level 1 security- by just authenticating username and password ///
//level 4 security - using md5 by just passing it like below //
//level 5 security- here we're using salting with hashing .
app.post("/login",function(req,res){


//   const loginEmail = req.body.username;
//   console.log(loginEmail);
//   // const loginPassword = md5(req.body.password);
//   const loginPassword = req.body.password;
//   console.log(loginPassword);
//
//   UserModel.findOne({email: loginEmail},function(err,foundUser){
//   if(err){
//     console.log(err);
//   }else{
//     if(foundUser){
//       bcrypt.compare(loginPassword, foundUser.password, function(err, result) {
//        if(result ===true ){
//          res.render("secrets");
//        }else{
//          res.send("not found");
//        }
// });
//     //   if(foundUser.password === loginPassword){
//     //     res.render("secrets");
//     //   }else{
//     //     res.send("not found");
//     //   }
//     }else{
//       res.send("not found");
//     }
//   }
//   });

const LoginUser = new UserModel({
username: req.body.username,
password: req.body.password
});
req.login(LoginUser,function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    });
  }
});
});

app.listen("3000",function(){
  console.log("Server started at port 3000");
});
