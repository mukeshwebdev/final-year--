const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { logAudit } = require("../utils/auditLogger");

const prisma = new PrismaClient();

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { badgeNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: { id: true, name: true, email: true, role: true, badgeNumber: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, badgeNumber } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, badgeNumber },
      select: { id: true, name: true, email: true, role: true, badgeNumber: true, createdAt: true },
    });

    await logAudit({ userId: req.user.id, action: "CREATE_USER", entity: "User", entityId: user.id });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, badgeNumber, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { ...(name && { name }), ...(role && { role }), ...(badgeNumber !== undefined && { badgeNumber }), ...(isActive !== undefined && { isActive }) },
      select: { id: true, name: true, email: true, role: true, badgeNumber: true, isActive: true },
    });

    await logAudit({ userId: req.user.id, action: "UPDATE_USER", entity: "User", entityId: id });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, entity, action, startDate, endDate } = req.query;
    const where = {};

    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    const [
      totalFIRs,
      statusBreakdown,
      crimeTypeBreakdown,
      recentFIRs,
      repeatOffenders,
      watchlistCount,
      userCount,
      monthlyFIRs,
    ] = await Promise.all([
      prisma.fIR.count(),
      prisma.fIR.groupBy({ by: ["status"], _count: true }),
      prisma.fIR.groupBy({ by: ["crimeType"], _count: true, orderBy: { _count: { crimeType: "desc" } } }),
      prisma.fIR.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.accused.count({ where: { isRepeatOffender: true } }),
      prisma.watchlist.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.fIR.groupBy({
        by: ["createdAt"],
        _count: true,
        where: { createdAt: { gte: twelveMonthsAgo } },
      }),
    ]);

    const topLocations = await prisma.fIR.groupBy({
      by: ["incidentLocation"],
      _count: true,
      orderBy: { _count: { incidentLocation: "desc" } },
      take: 10,
    });

    res.json({
      totalFIRs,
      statusBreakdown,
      crimeTypeBreakdown,
      recentFIRs,
      repeatOffenders,
      watchlistCount,
      userCount,
      topLocations,
      monthlyFIRs,
    });
  } catch (err) {
    next(err);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
    await logAudit({ userId: req.user.id, action: "RESET_USER_PASSWORD", entity: "User", entityId: id });
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, createUser, updateUser, getAuditLogs, getAnalytics, resetUserPassword };
