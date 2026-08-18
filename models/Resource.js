const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["Book", "Notes", "Lab Equipment", "Classroom", "Study Material", "Other"],
      required: true,
    },
    owner: {
      // the user who is sharing this resource (student/faculty/staff)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    location: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Available", "Unavailable", "Under Maintenance"],
      default: "Available",
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// text index to support search by title/description/category
resourceSchema.index({ title: "text", description: "text", category: "text" });

module.exports = mongoose.model("Resource", resourceSchema);
