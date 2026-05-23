const { PrismaClient } = require("@prisma/client");
const { validationResult } = require("express-validator");
const { generateFirNumber } = require("../utils/generateFirNumber");
const { logAudit } = require("../utils/auditLogger");
const aiService = require("../services/aiService");
const pdfService = require("../services/pdfService");
const emailService = require("../services/emailService");

const prisma = new PrismaClient();

const createFIR = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      complainant,
      accused,
      incidentDate,
      incidentTime,
      incidentLocation,
      description,
      crimeType,
      witnessDetails,
    } = req.body;

    const [firNumber, aiResult] = await Promise.all([
      generateFirNumber(),
      aiService.analyzeDescription(description),
    ]);

    const newComplainant = await prisma.complainant.create({ data: complainant });

    let newAccused = null;
    if (accused && accused.name) {
      newAccused = await prisma.accused.create({ data: accused });
      const existingFIRs = await prisma.fIR.findMany({
        where: { accused: { aadhaarNumber: accused.aadhaarNumber } },
        select: { id: true },
      });
      if (existingFIRs.length > 0) {
        await prisma.accused.update({
          where: { id: newAccused.id },
          data: { isRepeatOffender: true },
        });
      }
    }

    const fir = await prisma.fIR.create({
      data: {
        firNumber,
        complainantId: newComplainant.id,
        accusedId: newAccused?.id || null,
        incidentDate: new Date(incidentDate),
        incidentTime,
        incidentLocation,
        description,
        crimeType: crimeType || aiResult.crimeType || "Other",
        urgency: aiResult.urgency || "LOW",
        filedById: req.user.id,
        witnessDetails,
        editHistory: [{ action: "CREATED", by: req.user.id, at: new Date().toISOString() }],
      },
      include: { complainant: true, accused: true, filedBy: { select: { id: true, name: true, badgeNumber: true } } },
    });

    if (req.files && req.files.length > 0) {
      await prisma.evidence.createMany({
        data: req.files.map((f) => ({
          firId: fir.id,
          fileUrl: `/uploads/${f.filename}`,
          fileName: f.originalname,
          fileType: f.mimetype,
          fileSize: f.size,
        })),
      });
    }

    await logAudit({ userId: req.user.id, action: "CREATE_FIR", entity: "FIR", entityId: fir.id, ipAddress: req.ip });

    res.status(201).json({ fir, aiAnalysis: aiResult });
  } catch (err) {
    next(err);
  }
};

const listFIRs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      crimeType,
      startDate,
      endDate,
      search,
      assignedToMe,
    } = req.query;

    const where = {};

    if (req.user.role === "CITIZEN") {
      where.complainant = { phone: req.user.phone };
    }
    if (req.user.role === "SI" && assignedToMe === "true") {
      where.assignedToId = req.user.id;
    }
    if (status) where.status = status;
    if (crimeType) where.crimeType = crimeType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { firNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { incidentLocation: { contains: search, mode: "insensitive" } },
        { complainant: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [firs, total] = await Promise.all([
      prisma.fIR.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          complainant: true,
          accused: true,
          filedBy: { select: { id: true, name: true, badgeNumber: true } },
          assignedTo: { select: { id: true, name: true, badgeNumber: true } },
          _count: { select: { evidences: true, investigationLogs: true } },
        },
      }),
      prisma.fIR.count({ where }),
    ]);

    res.json({ firs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

const getFIR = async (req, res, next) => {
  try {
    const fir = await prisma.fIR.findUnique({
      where: { id: req.params.id },
      include: {
        complainant: true,
        accused: true,
        filedBy: { select: { id: true, name: true, badgeNumber: true, email: true } },
        assignedTo: { select: { id: true, name: true, badgeNumber: true } },
        evidences: true,
        investigationLogs: {
          include: { addedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
        courtHearings: { orderBy: { hearingDate: "asc" } },
        chargesheets: true,
      },
    });

    if (!fir) return res.status(404).json({ error: "FIR not found" });
    res.json(fir);
  } catch (err) {
    next(err);
  }
};

const updateFIR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.fIR.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "FIR not found" });

    const allowedFields = ["incidentLocation", "description", "crimeType", "urgency", "witnessDetails"];
    if (req.user.role === "INSPECTOR") allowedFields.push("status", "assignedToId");
    if (req.user.role === "SI") allowedFields.push("assignedToId");

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const history = existing.editHistory || [];
    history.push({ action: "UPDATED", by: req.user.id, at: new Date().toISOString(), fields: Object.keys(updateData) });
    updateData.editHistory = history;

    const updated = await prisma.fIR.update({
      where: { id },
      data: updateData,
      include: { complainant: true, accused: true },
    });

    await logAudit({ userId: req.user.id, action: "UPDATE_FIR", entity: "FIR", entityId: id, details: updateData });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const updateFIRStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["FILED", "UNDER_INVESTIGATION", "CHARGESHEET_GENERATED", "COURT", "CLOSED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const fir = await prisma.fIR.findUnique({ where: { id }, include: { complainant: true } });
    if (!fir) return res.status(404).json({ error: "FIR not found" });

    const existing = fir.editHistory || [];
    existing.push({ action: "STATUS_CHANGE", from: fir.status, to: status, by: req.user.id, at: new Date().toISOString() });

    const updated = await prisma.fIR.update({
      where: { id },
      data: { status, editHistory: existing },
    });

    await logAudit({ userId: req.user.id, action: "STATUS_CHANGE", entity: "FIR", entityId: id, details: { from: fir.status, to: status } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const assignFIR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    const officer = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!officer || !["SI", "INSPECTOR"].includes(officer.role)) {
      return res.status(400).json({ error: "Invalid officer" });
    }

    const updated = await prisma.fIR.update({ where: { id }, data: { assignedToId } });
    await logAudit({ userId: req.user.id, action: "ASSIGN_FIR", entity: "FIR", entityId: id, details: { assignedToId } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const addInvestigationLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) return res.status(400).json({ error: "Note is required" });

    const log = await prisma.investigationLog.create({
      data: { firId: id, note, addedById: req.user.id },
      include: { addedBy: { select: { id: true, name: true, role: true } } },
    });

    await logAudit({ userId: req.user.id, action: "ADD_INVESTIGATION_LOG", entity: "FIR", entityId: id });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

const downloadFIRPDF = async (req, res, next) => {
  try {
    const fir = await prisma.fIR.findUnique({
      where: { id: req.params.id },
      include: {
        complainant: true,
        accused: true,
        filedBy: { select: { name: true, badgeNumber: true } },
        assignedTo: { select: { name: true, badgeNumber: true } },
        evidences: true,
        investigationLogs: { include: { addedBy: { select: { name: true } } } },
      },
    });

    if (!fir) return res.status(404).json({ error: "FIR not found" });

    const isInternal = ["INSPECTOR", "SI", "WRITER", "SUPER_ADMIN"].includes(req.user.role);
    const pdfBuffer = await pdfService.generateFIRPDF(fir, isInternal);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="FIR_${fir.firNumber.replace(/\//g, "_")}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

const getAISummary = async (req, res, next) => {
  try {
    const fir = await prisma.fIR.findUnique({
      where: { id: req.params.id },
      include: { investigationLogs: true },
    });
    if (!fir) return res.status(404).json({ error: "FIR not found" });

    const notes = fir.investigationLogs.map((l) => l.note).join("\n");
    const summary = await aiService.summarizeCase(fir.description, notes, fir.crimeType, fir.status);

    await prisma.fIR.update({ where: { id: fir.id }, data: { aiSummary: summary.summary } });
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

const checkDuplicates = async (req, res, next) => {
  try {
    const { description } = req.body;
    const recentFIRs = await prisma.fIR.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: { id: true, firNumber: true, description: true },
    });

    const result = await aiService.checkDuplicates(description, recentFIRs);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const generateChargesheet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const fir = await prisma.fIR.findUnique({ where: { id } });
    if (!fir) return res.status(404).json({ error: "FIR not found" });

    const chargesheet = await prisma.chargesheet.create({
      data: { firId: id, content, generatedById: req.user.id },
    });

    await prisma.fIR.update({ where: { id }, data: { status: "CHARGESHEET_GENERATED" } });
    await logAudit({ userId: req.user.id, action: "GENERATE_CHARGESHEET", entity: "FIR", entityId: id });

    res.status(201).json(chargesheet);
  } catch (err) {
    next(err);
  }
};

const trackByNumber = async (req, res, next) => {
  try {
    const { firNumber } = req.params;
    const fir = await prisma.fIR.findUnique({
      where: { firNumber },
      select: {
        id: true,
        firNumber: true,
        status: true,
        crimeType: true,
        incidentDate: true,
        incidentLocation: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: { select: { name: true, badgeNumber: true } },
        courtHearings: { select: { hearingDate: true, courtName: true, outcome: true }, orderBy: { hearingDate: "desc" }, take: 1 },
      },
    });
    if (!fir) return res.status(404).json({ error: "FIR not found" });
    res.json(fir);
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
