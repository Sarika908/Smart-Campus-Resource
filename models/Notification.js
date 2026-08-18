const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      // who this notification is for
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Booking", "Approval", "Rejection", "Return", "Reminder", "General"],
      default: "General",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
