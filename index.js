const express = require('express')
const app = express()
const router = require('./router')
const passport = require('passport')
const config = require('./config')
const FacebookStrategy  = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session  = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const user = require('./models/User')
const bcrypt = require('bcrypt')
const path = require('path')
const jwt = require('jsonwebtoken');
const passportJWT = require('passport-jwt');


var ExtractJWT = passportJWT.ExtractJwt;
var JWTStrategy = passportJWT.Strategy;


app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs')

app.use(cookieParser()); //Parse cookie
app.use(bodyParser.urlencoded({ extended: false })); //Parse body để get data
app.use(session({ secret: 'keyboard cat', key: 'sid', resave: true,saveUninitialized: true}));  //Save user login
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


app.use('/', router)


passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});
  
  // Sử dụng Facebook Strategy cùng Passport.
passport.use(new FacebookStrategy({
      clientID: config.facebook_key,
      clientSecret:config.facebook_secret ,
      callbackURL: config.callback_url_facebook,
      profileFields: ['email', 'displayName']
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function () {
        user.findOne({ where:{
          email: profile._json.email
        }
      })
        .then(result=>{
          if(!result){
            var hash = bcrypt.hashSync(profile._json.id, 10);
            user.create({
              fullname: profile._json.name,
              username: profile._json.name,
              email: profile._json.email, 
              password: hash,
              type: false
          })
          }
        }).catch(err=> console.log(err))
        return done(null, profile);
      });
    }
));

  // Sử dụng Google Strategy cùng Passport.
passport.use(new GoogleStrategy({
    clientID: config.google_key,
    clientSecret: config.google_secret,
    callbackURL: config.callback_url_google,
    profileFields: ['email', 'displayName']
  }, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      user.findOne({ where:{
        email: profile._json.email
      }
    })
      .then(result=>{
        if(!result){
          var hash = bcrypt.hashSync(profile._json.sub, 10);
          user.create({
            fullname: profile._json.email,
            username: profile._json.email,
            email: profile._json.email, 
            password: hash,
            type: false
        })
        
        }
      }).catch(err=> console.log(err))
      return done(null, profile);
    });
  }
));

  // Sử dụng JWT Strategy cùng Passport.
// passport.use(new JWTStrategy({
//     //jwtFromRequest : ExtractJWT.fromUrlQueryParameter('token'),
//     jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken('Authorization'),
//     secretOrKey   : 'secret'
//   }, function (jwtPayload, cb) {
//     return user.findOne({
//         where:{
//             id: jwtPayload.id
//         }
//     })
//     .then(result=>{
//         if (result) {
//           cb(null, result);
            
//         } else {
//             cb(null, false);
//         }
//     })
//     .catch(err=>{
//       cb(err)
//     })
//   }
// ));

passport.use(new JWTStrategy(
  {
   jwtFromRequest: ExtractJWT.fromHeader('token'),
   secretOrKey: 'secret',
  },
  async (jwtPayload, cb) => {
    return user.findOne({
              where:{
                  id: jwtPayload.id
              }
          })
          .then(result=>{
              if (result) {
                cb(null, result);
                  
              } else {
                  cb(null, false);
              }
          })
          .catch(err=>{
            cb(err)
          })
  }
 ));

app.use(passport.initialize());


var PORT = process.env.PORT || 3000
app.listen(PORT)