const express = require("express");
const router = express.Router();
const {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  getMyResources,
} = require("../controllers/resourceController");
const { protect } = require("../middleware/auth");

router.get("/my/listings", protect, getMyResources);

router.route("/")
  .get(protect, getResources)
  .post(protect, createResource);

router.route("/:id")
  .get(protect, getResourceById)
  .put(protect, updateResource)
  .delete(protect, deleteResource);

module.exports = router;
