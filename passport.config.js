const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const users = require('./users');

const opts = {
    secretOrKey: 'secret',
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
}
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
passport.use(new JWTStrategy(opts, async (payload, done) => {
    try {
        const user = users.find(userFromDB => {
            if (userFromDB.login === payload.login) {
                return userFromDB;
            }
        });
        return user ? done(null, user) : done({ status: 401, message: 'Token is invalid'}, null);
    } catch {
        return done(err);
    }
}));