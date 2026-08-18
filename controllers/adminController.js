const User = require("../models/User");
const Resource = require("../models/Resource");
const Booking = require("../models/Booking");

// @desc   Get all users
// @route  GET /api/admin/users
// @access Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Activate/deactivate a user or change role
// @route  PUT /api/admin/users/:id
// @access Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.role) user.role = req.body.role;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isActive: updated.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Delete a user
// @route  DELETE /api/admin/users/:id
// @access Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get all bookings (admin overview)
// @route  GET /api/admin/bookings
// @access Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("resource", "title category")
      .populate("requestedBy", "name email role")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Dashboard analytics summary
// @route  GET /api/admin/analytics
// @access Private/Admin
const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalResources = await Resource.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const resourcesByCategory = await Resource.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // most requested resources - usage history / popularity
    const mostRequested = await Booking.aggregate([
      { $group: { _id: "$resource", totalRequests: { $sum: 1 } } },
      { $sort: { totalRequests: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "resources",
          localField: "_id",
          foreignField: "_id",
          as: "resourceInfo",
        },
      },
      { $unwind: "$resourceInfo" },
      {
        $project: {
          _id: 0,
          resourceId: "$resourceInfo._id",
          title: "$resourceInfo.title",
          category: "$resourceInfo.category",
          totalRequests: 1,
        },
      },
    ]);

    res.json({
      totalUsers,
      totalResources,
      totalBookings,
      bookingsByStatus,
      resourcesByCategory,
      usersByRole,
      mostRequestedResources: mostRequested,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBookings,
  getAnalytics,
};
