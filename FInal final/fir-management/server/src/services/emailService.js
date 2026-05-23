const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendFIRAcknowledgment = async (toEmail, fir, complainantName) => {
  if (!process.env.EMAIL_USER) {
    console.log("Email not configured — skipping acknowledgment.");
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "FIR System <noreply@fir.gov>",
    to: toEmail,
    subject: `FIR Acknowledgment — ${fir.firNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #1a365d;">FIR Filed Successfully</h2>
        <p>Dear <strong>${complainantName}</strong>,</p>
        <p>Your First Information Report has been registered with the following details:</p>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f7f7f7;"><strong>FIR Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${fir.firNumber}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f7f7f7;"><strong>Crime Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${fir.crimeType}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f7f7f7;"><strong>Date Filed</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(fir.createdAt).toLocaleDateString("en-IN")}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f7f7f7;"><strong>Status</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${fir.status}</td></tr>
        </table>
        <p style="margin-top: 20px;">You can track your FIR status using the FIR number above on our portal.</p>
        <p style="color: #718096; font-size: 12px;">This is an automated message. Please do not reply.</p>
      </div>
    `,
  });
};

const sendHearingReminder = async (toEmail, hearing) => {
  if (!process.env.EMAIL_USER) {
    console.log("Email not configured — skipping hearing reminder.");
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "FIR System <noreply@fir.gov>",
    to: toEmail,
    subject: `Court Hearing Reminder — FIR ${hearing.fir?.firNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #c53030;">Court Hearing Reminder</h2>
        <p>This is a reminder for the upcoming court hearing:</p>
        <table style="width:100%; border-collapse: collapse;">
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f7f7f7;"><strong>FIR Number</strong></td><td style="padding:8px;border:1px solid #ddd;">${hearing.fir?.firNumber || "N/A"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f7f7f7;"><strong>Hearing Date</strong></td><td style="padding:8px;border:1px solid #ddd;">${new Date(hearing.hearingDate).toLocaleDateString("en-IN")}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f7f7f7;"><strong>Court</strong></td><td style="padding:8px;border:1px solid #ddd;">${hearing.courtName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;background:#f7f7f7;"><strong>Judge</strong></td><td style="padding:8px;border:1px solid #ddd;">${hearing.judge || "TBD"}</td></tr>
        </table>
        <p style="color: #718096; font-size: 12px; margin-top: 20px;">Please ensure all case files are prepared in advance.</p>
      </div>
    `,
  });
};

module.exports = { sendFIRAcknowledgment, sendHearingReminder };
