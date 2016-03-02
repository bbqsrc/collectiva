"use strict"

const passport = require("passport"),
      User = require("../src/backend/models/index").User

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
