const Booking = require("../models/Booking");
const Resource = require("../models/Resource");
const notify = require("../utils/notify");

// @desc   Request/reserve a resource
// @route  POST /api/bookings
// @access Private
const createBooking = async (req, res) => {
  try {
    const { resourceId, quantity, fromDate, toDate } = req.body;

    if (!resourceId || !fromDate || !toDate) {
      return res.status(400).json({ message: "resourceId, fromDate and toDate are required" });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const requestedQty = quantity || 1;

    if (resource.status !== "Available" || resource.availableQuantity < requestedQty) {
      return res.status(400).json({ message: "Requested quantity not available right now" });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: "fromDate cannot be after toDate" });
    }

    const booking = await Booking.create({
      resource: resourceId,
      requestedBy: req.user._id,
      quantity: requestedQty,
      fromDate,
      toDate,
    });

    // notify resource owner about the new request
    await notify({
      user: resource.owner,
      message: `${req.user.name} requested "${resource.title}" (${requestedQty} unit(s))`,
      type: "Booking",
      relatedBooking: booking._id,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Approve a booking request (resource owner or Admin)
// @route  PUT /api/bookings/:id/approve
// @access Private
const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("resource");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "Pending") {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    const resource = booking.resource;
    const isOwner = resource.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to approve this booking" });
    }

    if (resource.availableQuantity < booking.quantity) {
      return res.status(400).json({ message: "Not enough available quantity to approve" });
    }

    booking.status = "Approved";
    booking.approvedBy = req.user._id;
    await booking.save();

    resource.availableQuantity -= booking.quantity;
    if (resource.availableQuantity === 0) {
      resource.status = "Unavailable";
    }
    await resource.save();

    await notify({
      user: booking.requestedBy,
      message: `Your booking for "${resource.title}" has been approved`,
      type: "Approval",
      relatedBooking: booking._id,
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Reject a booking request (resource owner or Admin)
// @route  PUT /api/bookings/:id/reject
// @access Private
const rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("resource");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "Pending") {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    const resource = booking.resource;
    const isOwner = resource.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to reject this booking" });
    }

    booking.status = "Rejected";
    booking.remarks = req.body.remarks || "";
    await booking.save();

    await notify({
      user: booking.requestedBy,
      message: `Your booking for "${resource.title}" was rejected`,
      type: "Rejection",
      relatedBooking: booking._id,
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Mark an approved booking as returned
// @route  PUT /api/bookings/:id/return
// @access Private
const returnBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("resource");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "Approved") {
      return res.status(400).json({ message: "Only approved bookings can be returned" });
    }

    const resource = booking.resource;
    const isOwner = resource.owner.toString() === req.user._id.toString();
    const isRequester = booking.requestedBy.toString() === req.user._id.toString();

    if (!isOwner && !isRequester && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to return this booking" });
    }

    booking.status = "Returned";
    booking.returnedDate = new Date();
    await booking.save();

    resource.availableQuantity += booking.quantity;
    if (resource.availableQuantity > 0) {
      resource.status = "Available";
    }
    await resource.save();

    await notify({
      user: resource.owner,
      message: `"${resource.title}" has been returned by the borrower`,
      type: "Return",
      relatedBooking: booking._id,
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Cancel own pending booking request
// @route  PUT /api/bookings/:id/cancel
// @access Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status !== "Pending") {
      return res.status(400).json({ message: "Only pending bookings can be cancelled" });
    }

    booking.status = "Cancelled";
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get bookings made by the logged-in user
// @route  GET /api/bookings/my
// @access Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ requestedBy: req.user._id })
      .populate("resource", "title category location")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get incoming booking requests for resources the user owns
// @route  GET /api/bookings/incoming
// @access Private
const getIncomingBookings = async (req, res) => {
  try {
    const myResources = await Resource.find({ owner: req.user._id }).select("_id");
    const resourceIds = myResources.map((r) => r._id);

    const bookings = await Booking.find({ resource: { $in: resourceIds } })
      .populate("resource", "title category")
      .populate("requestedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createBooking,
  approveBooking,
  rejectBooking,
  returnBooking,
  cancelBooking,
  getMyBookings,
  getIncomingBookings,
};
