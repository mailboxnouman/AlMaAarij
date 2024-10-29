const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
  // Local strategy
  // passport.use(new LocalStrategy(async (username, password, done) => {
  //   try {
  //     const user = await User.findOne({ username });
  //     if (!user) return done(null, false, { message: 'Incorrect username.' });
  //     if (!(await user.isValidPassword(password))) return done(null, false, { message: 'Incorrect password.' });
  //     return done(null, user);
  //   } catch (err) {
  //     return done(err);
  //   }
  // }));

  // Google strategy
  passport.use(new GoogleStrategy({
      clientID: '1017393658095-khqfm1btdm5h79246smv47hvt3kitvaa.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: '/auth/google/callback',
      
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            displayName: profile.displayName,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      // console.log("Deserializing user:", user);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
};
