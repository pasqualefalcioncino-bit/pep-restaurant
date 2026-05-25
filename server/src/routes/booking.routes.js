const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/booking.controller");
const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

router.post("/", verifyToken, bookingController.createBooking);
router.get("/my", verifyToken, checkRole("cliente"), bookingController.getMyBookings);
router.get("/", verifyToken, checkRole("admin"), bookingController.getBookings);
router.put("/:id/status", verifyToken, checkRole("admin"), bookingController.updateBookingStatus);
router.delete("/:id", verifyToken, checkRole("admin"), bookingController.deleteBooking);

module.exports = router;
