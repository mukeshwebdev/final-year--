const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const generateFIRPDF = async (fir, isInternal = true) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      if (!isInternal) {
        doc.save();
        doc.opacity(0.07);
        doc.fontSize(60).fillColor("gray").rotate(45, { origin: [300, 400] }).text("CITIZEN COPY", 50, 300, { width: 500, align: "center" });
        doc.restore();
      }

      doc.fontSize(18).fillColor("#1a365d").font("Helvetica-Bold").text("FIRST INFORMATION REPORT (FIR)", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor("#2d3748").text("Government of India — Ministry of Home Affairs", { align: "center" });
      doc.fontSize(11).fillColor("#4a5568").text("City Police Station, Central Division", { align: "center" });
      doc.moveDown(0.5);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#2b6cb0").lineWidth(2).stroke();
      doc.moveDown(0.5);

      const addField = (label, value, opts = {}) => {
        doc.fontSize(10).fillColor("#4a5568").font("Helvetica-Bold").text(label + ": ", { continued: true });
        doc.font("Helvetica").fillColor("#2d3748").text(value || "N/A", opts);
      };

      addField("FIR Number", fir.firNumber);
      addField("Date Filed", new Date(fir.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }));
      addField("Time Filed", fir.incidentTime || new Date(fir.createdAt).toLocaleTimeString("en-IN"));
      addField("Crime Type", fir.crimeType);
      addField("Status", fir.status);
      addField("Urgency Level", fir.urgency);
      doc.moveDown(0.5);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor("#2b6cb0").font("Helvetica-Bold").text("COMPLAINANT DETAILS");
      doc.moveDown(0.2);
      addField("Name", fir.complainant?.name);
      addField("Address", fir.complainant?.address);
      addField("Phone", fir.complainant?.phone);
      if (isInternal) addField("Aadhaar", fir.complainant?.aadhaarNumber);
      doc.moveDown(0.5);

      if (fir.accused) {
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
        doc.moveDown(0.3);
        doc.fontSize(12).fillColor("#c53030").font("Helvetica-Bold").text("ACCUSED DETAILS");
        doc.moveDown(0.2);
        addField("Name", fir.accused.name);
        addField("Address", fir.accused.address);
        if (isInternal) addField("Aadhaar", fir.accused.aadhaarNumber);
        if (fir.accused.isRepeatOffender) {
          doc.fontSize(10).fillColor("#c53030").font("Helvetica-Bold").text("⚠ REPEAT OFFENDER");
        }
        if (fir.accused.isWatchlisted) {
          doc.fontSize(10).fillColor("#c53030").font("Helvetica-Bold").text("⚠ WATCHLISTED INDIVIDUAL");
        }
        doc.moveDown(0.5);
      }

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor("#2b6cb0").font("Helvetica-Bold").text("INCIDENT DETAILS");
      doc.moveDown(0.2);
      addField("Incident Date", new Date(fir.incidentDate).toLocaleDateString("en-IN"));
      addField("Incident Time", fir.incidentTime || "Not specified");
      addField("Location", fir.incidentLocation);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor("#4a5568").font("Helvetica-Bold").text("Description:");
      doc.font("Helvetica").fillColor("#2d3748").fontSize(10).text(fir.description, { width: 490, align: "left" });
      doc.moveDown(0.5);

      if (fir.witnessDetails) {
        doc.fontSize(10).fillColor("#4a5568").font("Helvetica-Bold").text("Witness Details:");
        doc.font("Helvetica").fillColor("#2d3748").fontSize(10).text(fir.witnessDetails, { width: 490 });
        doc.moveDown(0.5);
      }

      if (isInternal && fir.investigationLogs && fir.investigationLogs.length > 0) {
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
        doc.moveDown(0.3);
        doc.fontSize(12).fillColor("#2b6cb0").font("Helvetica-Bold").text("INVESTIGATION NOTES");
        doc.moveDown(0.2);
        for (const log of fir.investigationLogs.slice(0, 5)) {
          doc.fontSize(9).fillColor("#718096").text(`[${new Date(log.createdAt).toLocaleDateString("en-IN")}] ${log.addedBy?.name || "Officer"}: `);
          doc.fontSize(9).fillColor("#2d3748").text(log.note, { width: 490 });
          doc.moveDown(0.2);
        }
        doc.moveDown(0.3);
      }

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e2e8f0").lineWidth(1).stroke();
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor("#2b6cb0").font("Helvetica-Bold").text("HANDLING OFFICER");
      doc.moveDown(0.2);
      addField("Filed By", fir.filedBy?.name);
      addField("Badge Number", fir.filedBy?.badgeNumber);
      if (fir.assignedTo) {
        addField("Investigating Officer", fir.assignedTo?.name);
        addField("Badge Number", fir.assignedTo?.badgeNumber);
      }
      doc.moveDown(0.5);

      const qrData = `FIR:${fir.firNumber}|DATE:${new Date(fir.createdAt).toLocaleDateString("en-IN")}|STATUS:${fir.status}`;
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 80, margin: 1 });
      const currentY = doc.y;
      doc.image(qrBuffer, 460, currentY, { width: 80 });
      doc.fontSize(9).fillColor("#718096").text("Scan to verify authenticity", 440, currentY + 85, { width: 110, align: "center" });

      doc.moveTo(50, doc.page.height - 80).lineTo(545, doc.page.height - 80).strokeColor("#2b6cb0").lineWidth(1).stroke();
      doc.fontSize(8).fillColor("#718096").text(
        `Generated on ${new Date().toLocaleString("en-IN")} | FIR Management System | ${isInternal ? "OFFICIAL USE ONLY" : "CITIZEN COPY — NOT FOR COURT USE"}`,
        50,
        doc.page.height - 65,
        { align: "center", width: 495 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateFIRPDF };
