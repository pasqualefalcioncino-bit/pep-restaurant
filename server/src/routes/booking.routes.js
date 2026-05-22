const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/booking.controller");
const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

router.post("/", bookingController.createBooking);
router.get("/", verifyToken, checkRole("admin"), bookingController.getBookings);
router.put("/:id/status", verifyToken, checkRole("admin"), bookingController.updateBookingStatus);

module.exports = router;
