const Resource = require("../models/Resource");

// @desc   Add a new resource to share (book, notes, equipment, classroom, etc.)
// @route  POST /api/resources
// @access Private (Student, Faculty, Staff, Admin)
const createResource = async (req, res) => {
  try {
    const { title, description, category, quantity, location, imageUrl } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Title and category are required" });
    }

    const resource = await Resource.create({
      title,
      description,
      category,
      owner: req.user._id,
      quantity: quantity || 1,
      availableQuantity: quantity || 1,
      location,
      imageUrl,
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get all resources with optional search & filter
// @route  GET /api/resources?keyword=&category=&status=
// @access Private
const getResources = async (req, res) => {
  try {
    const { keyword, category, status } = req.query;

    const filter = {};

    if (keyword) {
      filter.$text = { $search: keyword };
    }
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }

    const resources = await Resource.find(filter)
      .populate("owner", "name email role department")
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get single resource by id
// @route  GET /api/resources/:id
// @access Private
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate(
      "owner",
      "name email role department"
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Update a resource (only owner or Admin)
// @route  PUT /api/resources/:id
// @access Private
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const isOwner = resource.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to update this resource" });
    }

    const fields = ["title", "description", "category", "quantity", "availableQuantity", "location", "status", "imageUrl"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        resource[field] = req.body[field];
      }
    });

    const updated = await resource.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Delete a resource (only owner or Admin)
// @route  DELETE /api/resources/:id
// @access Private
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const isOwner = resource.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to delete this resource" });
    }

    await resource.deleteOne();
    res.json({ message: "Resource removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get resources shared by logged-in user
// @route  GET /api/resources/my/listings
// @access Private
const getMyResources = async (req, res) => {
  try {
    const resources = await Resource.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  getMyResources,
};
