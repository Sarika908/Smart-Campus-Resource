const Notification = require("../models/Notification");

// small helper to create a notification, used across controllers
const notify = async ({ user, message, type = "General", relatedBooking = null }) => {
  try {
    await Notification.create({ user, message, type, relatedBooking });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

module.exports = notify;
