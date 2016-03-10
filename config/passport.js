"use strict"

const passport = require("passport"),
      LocalStrategy = require("passport-local").Strategy,
      AdminUser = require("../src/backend/models/index").AdminUser,
      logger = require("../src/backend/lib/logger")

passport.use(new LocalStrategy({
  usernameField: "email",
  passwordField: "password"
}, AdminUser.authenticate))

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  return AdminUser.findById(id)
  .nodeify(done)
  .catch((error) => {
    logger.error("passport", "failed to deserialize", { error })
    done(null, false)
  })
})
