const { PrismaClient } = require("@prisma/client");
const { logAudit } = require("../utils/auditLogger");

const prisma = new PrismaClient();

const searchByAadhaar = async (req, res, next) => {
  try {
    const { aadhaarNumber } = req.params;
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return res.status(400).json({ error: "Invalid Aadhaar number — must be 12 digits" });
    }

    const citizen = await prisma.mockAadhaarCitizen.findUnique({ where: { aadhaarNumber } });
    if (!citizen) return res.status(404).json({ error: "No record found for this Aadhaar number" });

    const accused = await prisma.accused.findFirst({ where: { aadhaarNumber } });

    let criminalHistory = [];
    let watchlistEntries = [];
    let totalCases = 0;

    if (accused) {
      criminalHistory = await prisma.fIR.findMany({
        where: { accusedId: accused.id },
        select: {
          id: true,
          firNumber: true,
          crimeType: true,
          status: true,
          incidentDate: true,
          incidentLocation: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      watchlistEntries = await prisma.watchlist.findMany({
        where: { accusedId: accused.id, isActive: true },
        include: { addedBy: { select: { name: true, badgeNumber: true } } },
      });

      totalCases = criminalHistory.length;
    }

    await logAudit({
      userId: req.user.id,
      action: "AADHAAR_SEARCH",
      entity: "MockAadhaarCitizen",
      details: { aadhaarNumber },
      ipAddress: req.ip,
    });

    res.json({
      citizen,
      accused,
      criminalHistory,
      watchlistEntries,
      totalCases,
      isRepeatOffender: accused?.isRepeatOffender || false,
      isWatchlisted: accused?.isWatchlisted || false,
    });
  } catch (err) {
    next(err);
  }
};

const addToWatchlist = async (req, res, next) => {
  try {
    const { accusedId } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ error: "Reason is required" });

    const accused = await prisma.accused.findUnique({ where: { id: accusedId } });
    if (!accused) return res.status(404).json({ error: "Accused not found" });

    const entry = await prisma.watchlist.create({
      data: { accusedId, reason, addedById: req.user.id },
    });

    await prisma.accused.update({ where: { id: accusedId }, data: { isWatchlisted: true } });
    await logAudit({ userId: req.user.id, action: "ADD_TO_WATCHLIST", entity: "Accused", entityId: accusedId });

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

const removeFromWatchlist = async (req, res, next) => {
  try {
    const { accusedId } = req.params;

    await prisma.watchlist.updateMany({
      where: { accusedId, isActive: true },
      data: { isActive: false },
    });

    const remaining = await prisma.watchlist.count({ where: { accusedId, isActive: true } });
    if (remaining === 0) {
      await prisma.accused.update({ where: { id: accusedId }, data: { isWatchlisted: false } });
    }

    await logAudit({ userId: req.user.id, action: "REMOVE_FROM_WATCHLIST", entity: "Accused", entityId: accusedId });
    res.json({ message: "Removed from watchlist" });
  } catch (err) {
    next(err);
  }
};

const getWatchlist = async (req, res, next) => {
  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { isActive: true },
      include: {
        accused: true,
        addedBy: { select: { name: true, badgeNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(watchlist);
  } catch (err) {
    next(err);
  }
};

const searchCitizen = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Search query required" });

    const citizens = await prisma.mockAadhaarCitizen.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { aadhaarNumber: { contains: query } },
          { phone: { contains: query } },
        ],
      },
      take: 20,
    });
    res.json(citizens);
  } catch (err) {
    next(err);
  }
};

module.exports = { searchByAadhaar, addToWatchlist, removeFromWatchlist, getWatchlist, searchCitizen };
