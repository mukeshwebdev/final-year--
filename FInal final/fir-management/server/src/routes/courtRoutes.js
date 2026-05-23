const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  addHearing,
  updateHearing,
  getHearings,
  getUpcomingHearings,
  sendHearingReminder,
  getFIRTimeline,
} = require("../controllers/courtController");

const router = express.Router();
router.use(authenticate);

router.get("/upcoming", authorize("INSPECTOR", "SUPER_ADMIN", "SI"), getUpcomingHearings);
router.get("/fir/:firId/hearings", getHearings);
router.get("/fir/:firId/timeline", getFIRTimeline);
router.post("/fir/:firId/hearings", authorize("INSPECTOR", "SUPER_ADMIN"), addHearing);
router.put("/hearings/:hearingId", authorize("INSPECTOR", "SUPER_ADMIN"), updateHearing);
router.post("/hearings/:hearingId/remind", authorize("INSPECTOR", "SUPER_ADMIN"), sendHearingReminder);

module.exports = router;
