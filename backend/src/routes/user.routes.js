const express = require("express");

const router = express.Router();

// Import user controllers
const {
    registerUser,
    loginUser,
    getCurrentUser
} = require("../controllers/user.controller");

// Import authentication middleware
const isUserAuthenticated = require("../middlewares/auth.middleware");


// =====================================
// USER REGISTRATION
// POST /api/users/register
// =====================================

router.post("/register", registerUser);


// =====================================
// USER LOGIN
// POST /api/users/login
// =====================================

router.post("/login", loginUser);


// =====================================
// GET CURRENT USER
// GET /api/users/me
// =====================================

router.get("/me", isUserAuthenticated, getCurrentUser);


module.exports = router;