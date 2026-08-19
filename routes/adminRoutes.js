const express = require("express");
const router = express.Router();
const {
  createUserByAdmin,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBookings,
  getAnalytics,
  triggerReminders,
} = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

// all admin routes require login + Admin role
router.use(protect, authorize("Admin"));

router.post("/create-user", createUserByAdmin);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/bookings", getAllBookings);
router.get("/analytics", getAnalytics);
router.post("/trigger-reminders", triggerReminders);

module.exports = router;