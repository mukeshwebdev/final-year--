const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  searchByAadhaar,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  searchCitizen,
} = require("../controllers/aadhaarController");

const router = express.Router();
router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "INSPECTOR", "SI", "WRITER"));

router.get("/search", searchCitizen);
router.get("/watchlist", getWatchlist);
router.get("/:aadhaarNumber", searchByAadhaar);
router.post("/watchlist/:accusedId", authorize("SUPER_ADMIN", "INSPECTOR"), addToWatchlist);
router.delete("/watchlist/:accusedId", authorize("SUPER_ADMIN", "INSPECTOR"), removeFromWatchlist);

module.exports = router;
