const express = require("express");
const router = express.Router();
const {
  createBooking,
  approveBooking,
  rejectBooking,
  returnBooking,
  cancelBooking,
  getMyBookings,
  getIncomingBookings,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

router.get("/my", protect, getMyBookings);
router.get("/incoming", protect, getIncomingBookings);

router.post("/", protect, createBooking);
router.put("/:id/approve", protect, approveBooking);
router.put("/:id/reject", protect, rejectBooking);
router.put("/:id/return", protect, returnBooking);
router.put("/:id/cancel", protect, cancelBooking);

module.exports = router;
