const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { getUsers, createUser, updateUser, getAuditLogs, getAnalytics, resetUserPassword } = require("../controllers/adminController");

const router = express.Router();
router.use(authenticate);
router.use(authorize("SUPER_ADMIN"));

router.get("/users", getUsers);
router.post(
  "/users",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["SUPER_ADMIN", "INSPECTOR", "SI", "WRITER", "CITIZEN"]),
  ],
  createUser
);
router.put("/users/:id", updateUser);
router.post("/users/:id/reset-password", [body("newPassword").isLength({ min: 6 })], resetUserPassword);
router.get("/audit-logs", getAuditLogs);
router.get("/analytics", getAnalytics);

module.exports = router;
