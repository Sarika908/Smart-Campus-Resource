const cron = require("node-cron");
const Booking = require("../models/Booking");
const notify = require("./notify");

// Runs once a day (default: every day at 8:00 AM server time).
// Finds all "Approved" bookings whose toDate falls within the next
// REMINDER_WINDOW_DAYS days and are not returned yet, then sends a
// "Reminder" notification to the borrower (if not already reminded today).
const REMINDER_WINDOW_DAYS = 2; // remind when 2 days or less remain

const runReturnDeadlineCheck = async () => {
  try {
    const now = new Date();
    const windowEnd = new Date();
    windowEnd.setDate(now.getDate() + REMINDER_WINDOW_DAYS);

    // approved bookings whose return deadline is within the window
    const upcomingReturns = await Booking.find({
      status: "Approved",
      toDate: { $gte: now, $lte: windowEnd },
    }).populate("resource", "title");

    for (const booking of upcomingReturns) {
      const daysLeft = Math.ceil((booking.toDate - now) / (1000 * 60 * 60 * 24));

      await notify({
        user: booking.requestedBy,
        message: `Reminder: "${booking.resource.title}" is due for return in ${daysLeft} day(s)`,
        type: "Reminder",
        relatedBooking: booking._id,
      });
    }

    if (upcomingReturns.length > 0) {
      console.log(`[Reminder Job] Sent ${upcomingReturns.length} return-deadline reminder(s).`);
    }
  } catch (error) {
    console.error("[Reminder Job] Failed:", error.message);
  }
};

// schedule: every day at 8:00 AM (cron format: minute hour day month weekday)
const startReminderJob = () => {
  cron.schedule("0 8 * * *", () => {
    console.log("[Reminder Job] Running daily return-deadline check...");
    runReturnDeadlineCheck();
  });

  console.log("[Reminder Job] Scheduled to run daily at 8:00 AM.");
};

module.exports = { startReminderJob, runReturnDeadlineCheck };