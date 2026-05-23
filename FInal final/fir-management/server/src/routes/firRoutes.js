const express = require("express");
const multer = require("multer");
const path = require("path");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createFIR,
  listFIRs,
  getFIR,
  updateFIR,
  updateFIRStatus,
  assignFIR,
  addInvestigationLog,
  downloadFIRPDF,
  getAISummary,
  checkDuplicates,
  generateChargesheet,
  trackByNumber,
} = require("../controllers/firController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads")),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Invalid file type"));
  },
});

router.get("/track/:firNumber", trackByNumber);

router.use(authenticate);

router.get("/", listFIRs);
router.get("/:id", getFIR);
router.get("/:id/pdf", downloadFIRPDF);
router.get("/:id/summary", authorize("INSPECTOR", "SUPER_ADMIN", "SI"), getAISummary);

router.post(
  "/",
  authorize("WRITER", "SUPER_ADMIN", "INSPECTOR"),
  upload.array("evidences", 10),
  [
    body("complainant.name").notEmpty(),
    body("complainant.phone").notEmpty(),
    body("incidentDate").isISO8601(),
    body("incidentLocation").notEmpty(),
    body("description").isLength({ min: 20 }),
  ],
  createFIR
);

router.post("/check-duplicates", authenticate, checkDuplicates);

router.put("/:id", authorize("WRITER", "SUPER_ADMIN", "INSPECTOR", "SI"), updateFIR);

router.patch(
  "/:id/status",
  authorize("INSPECTOR", "SUPER_ADMIN"),
  [body("status").isIn(["FILED", "UNDER_INVESTIGATION", "CHARGESHEET_GENERATED", "COURT", "CLOSED"])],
  updateFIRStatus
);

router.patch("/:id/assign", authorize("INSPECTOR", "SUPER_ADMIN"), assignFIR);

router.post(
  "/:id/investigation-log",
  authorize("SI", "INSPECTOR", "SUPER_ADMIN"),
  [body("note").notEmpty()],
  addInvestigationLog
);

router.post(
  "/:id/chargesheet",
  authorize("INSPECTOR", "SUPER_ADMIN"),
  [body("content").notEmpty()],
  generateChargesheet
);

module.exports = router;
