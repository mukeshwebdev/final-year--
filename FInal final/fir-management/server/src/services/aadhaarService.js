const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const lookupAadhaar = async (aadhaarNumber) => {
  return prisma.mockAadhaarCitizen.findUnique({ where: { aadhaarNumber } });
};

const verifyAadhaar = async (aadhaarNumber, name) => {
  const citizen = await lookupAadhaar(aadhaarNumber);
  if (!citizen) return { valid: false, reason: "Aadhaar number not found" };
  const nameMatch = citizen.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(citizen.name.toLowerCase());
  return { valid: nameMatch, citizen: nameMatch ? citizen : null, reason: nameMatch ? "Verified" : "Name mismatch" };
};

module.exports = { lookupAadhaar, verifyAadhaar };
