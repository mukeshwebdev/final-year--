const express = require("express");
const { body } = require("express-validator");
const { login, refresh, getMe, changePassword } = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  login
);

router.post("/refresh", refresh);

router.get("/me", authenticate, getMe);

router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  changePassword
);

module.exports = router;
