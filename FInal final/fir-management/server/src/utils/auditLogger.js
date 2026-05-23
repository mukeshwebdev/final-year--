const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const logAudit = async ({ userId, action, entity, entityId, details, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

module.exports = { logAudit };
