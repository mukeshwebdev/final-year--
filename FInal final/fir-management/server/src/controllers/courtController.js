const { PrismaClient } = require("@prisma/client");
const { logAudit } = require("../utils/auditLogger");
const emailService = require("../services/emailService");

const prisma = new PrismaClient();

const addHearing = async (req, res, next) => {
  try {
    const { firId } = req.params;
    const { hearingDate, courtName, judge, order, outcome, nextDate } = req.body;

    const fir = await prisma.fIR.findUnique({ where: { id: firId } });
    if (!fir) return res.status(404).json({ error: "FIR not found" });

    const hearing = await prisma.courtHearing.create({
      data: {
        firId,
        hearingDate: new Date(hearingDate),
        courtName,
        judge,
        order,
        outcome,
        nextDate: nextDate ? new Date(nextDate) : null,
      },
    });

    if (fir.status !== "COURT" && fir.status !== "CLOSED") {
      await prisma.fIR.update({ where: { id: firId }, data: { status: "COURT" } });
    }

    await logAudit({ userId: req.user.id, action: "ADD_COURT_HEARING", entity: "FIR", entityId: firId });
    res.status(201).json(hearing);
  } catch (err) {
    next(err);
  }
};

const updateHearing = async (req, res, next) => {
  try {
    const { hearingId } = req.params;
    const { order, outcome, nextDate } = req.body;

    const hearing = await prisma.courtHearing.update({
      where: { id: hearingId },
      data: {
        ...(order && { order }),
        ...(outcome && { outcome }),
        ...(nextDate && { nextDate: new Date(nextDate) }),
      },
    });

    await logAudit({ userId: req.user.id, action: "UPDATE_COURT_HEARING", entity: "CourtHearing", entityId: hearingId });
    res.json(hearing);
  } catch (err) {
    next(err);
  }
};

const getHearings = async (req, res, next) => {
  try {
    const { firId } = req.params;
    const hearings = await prisma.courtHearing.findMany({
      where: { firId },
      orderBy: { hearingDate: "asc" },
    });
    res.json(hearings);
  } catch (err) {
    next(err);
  }
};

const getUpcomingHearings = async (req, res, next) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const hearings = await prisma.courtHearing.findMany({
      where: {
        hearingDate: { gte: today, lte: nextWeek },
      },
      include: {
        fir: {
          select: {
            firNumber: true,
            crimeType: true,
            assignedTo: { select: { name: true, email: true, badgeNumber: true } },
          },
        },
      },
      orderBy: { hearingDate: "asc" },
    });

    res.json(hearings);
  } catch (err) {
    next(err);
  }
};

const sendHearingReminder = async (req, res, next) => {
  try {
    const { hearingId } = req.params;
    const hearing = await prisma.courtHearing.findUnique({
      where: { id: hearingId },
      include: {
        fir: {
          include: {
            assignedTo: true,
            filedBy: true,
          },
        },
      },
    });

    if (!hearing) return res.status(404).json({ error: "Hearing not found" });

    const recipients = [];
    if (hearing.fir.assignedTo?.email) recipients.push(hearing.fir.assignedTo.email);
    if (hearing.fir.filedBy?.email) recipients.push(hearing.fir.filedBy.email);

    for (const email of [...new Set(recipients)]) {
      await emailService.sendHearingReminder(email, hearing);
    }

    res.json({ message: "Reminders sent", recipients: [...new Set(recipients)] });
  } catch (err) {
    next(err);
  }
};

const getFIRTimeline = async (req, res, next) => {
  try {
    const { firId } = req.params;
    const fir = await prisma.fIR.findUnique({
      where: { id: firId },
      include: {
        investigationLogs: { include: { addedBy: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } },
        courtHearings: { orderBy: { hearingDate: "asc" } },
        chargesheets: true,
        evidences: true,
      },
    });

    if (!fir) return res.status(404).json({ error: "FIR not found" });

    const timeline = [];

    timeline.push({ type: "FIR_FILED", date: fir.createdAt, description: `FIR ${fir.firNumber} filed` });

    for (const log of fir.investigationLogs) {
      timeline.push({ type: "INVESTIGATION_LOG", date: log.createdAt, description: log.note, by: log.addedBy?.name });
    }

    for (const cs of fir.chargesheets) {
      timeline.push({ type: "CHARGESHEET", date: cs.generatedAt, description: "Chargesheet generated" });
    }

    for (const hearing of fir.courtHearings) {
      timeline.push({ type: "COURT_HEARING", date: hearing.hearingDate, description: `Hearing at ${hearing.courtName}`, outcome: hearing.outcome });
    }

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ fir: { firNumber: fir.firNumber, status: fir.status }, timeline });
  } catch (err) {
    next(err);
  }
};

module.exports = { addHearing, updateHearing, getHearings, getUpcomingHearings, sendHearingReminder, getFIRTimeline };
