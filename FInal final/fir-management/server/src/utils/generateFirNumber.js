const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateFirNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.fIR.count({
    where: {
      firNumber: { startsWith: `FIR/${year}/` },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `FIR/${year}/${seq}`;
};

module.exports = { generateFirNumber };
