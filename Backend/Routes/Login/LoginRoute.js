const express = require("express");
const { loginWithPassword, changePasswordByUser, userLogout } = require("../../Controller/Login/LoginController");

const router = express.Router();
router.post("/login", loginWithPassword);
router.post("/changepassword", changePasswordByUser);
router.put("/logout/:id", userLogout);

module.exports = router;    