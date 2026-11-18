import PDFDocument from "pdfkit";

export const generateSettlementPDF = async (claim, user, vehicle, policy) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 45,
      bufferPages: true,
      pdfVersion: "1.7",
      lang: "en-US",
      displayTitle: true,
      info: {
        Title: `Settlement Notice - ${claim.id}`,
        Author: "VIMS Auto Insurance",
        Subject: "Official Claim Settlement Notice",
        CreationDate: new Date(),
      },
    });

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on("error", reject);

    // Primary Colors
    const primaryNavy = "#0f172a";
    const brandBlue = "#2563eb";
    const darkGray = "#334155";
    const lightMuted = "#64748b";
    const emeraldGreen = "#059669";

    // 1. Header & Brand Banner
    doc
      .fillColor(primaryNavy)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("VIMS VEHICLE INSURANCE", 45, 45, { align: "left" });

    doc
      .fillColor(lightMuted)
      .fontSize(9)
      .font("Helvetica")
      .text("Underwriting & Claims Adjudication Services", 45, 72)
      .text("Official Insurance Claim Settlement Certificate", 45, 84);

    // Status Chip (Top Right)
    doc
      .roundedRect(420, 45, 130, 28, 6)
      .fillAndStroke("#ecfdf5", emeraldGreen);

    doc
      .fillColor(emeraldGreen)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("SETTLEMENT APPROVED", 425, 53, { width: 120, align: "center" });

    // Divider Line
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(45, 105)
      .lineTo(550, 105)
      .stroke();

    // 2. Reference & Date Summary
    const claimantName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Valued Policyholder"
      : "Valued Policyholder";

    const payoutAmount = Number(claim.amount || claim.details?.payoutDeducted || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const issueDateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc
      .fillColor(darkGray)
      .fontSize(9)
      .font("Helvetica")
      .text(`Certificate Date: ${issueDateStr}`, 45, 115)
      .text(`Claim ID: ${claim.id}`, 45, 128)
      .text(`Policy ID: ${policy?.id || claim.policyId || "N/A"}`, 320, 115)
      .text(`Policy Plan: ${policy?.name || "Standard Auto Coverage"}`, 320, 128);

    // 3. Highlight Settlement Payout Box
    doc
      .roundedRect(45, 150, 505, 70, 8)
      .fillAndStroke("#f8fafc", "#cbd5e1");

    doc
      .fillColor(lightMuted)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("AUTHORIZED SETTLEMENT PAYOUT AMOUNT", 60, 162);

    doc
      .fillColor(emeraldGreen)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(`$${payoutAmount} USD`, 60, 180);

    doc
      .fillColor(lightMuted)
      .fontSize(8.5)
      .font("Helvetica")
      .text("Payment has been authorized by the Claims Adjuster and deducted from available policy coverage.", 60, 208);

    // 4. Two-Column Information Details
    const colY = 235;

    // Left Column: Insured Vehicle & Claimant
    doc
      .fillColor(primaryNavy)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Insured & Vehicle Information", 45, colY);

    doc
      .fillColor(darkGray)
      .fontSize(9)
      .font("Helvetica")
      .text(`Policyholder: ${claimmentSafe(claimantName)}`, 45, colY + 18)
      .text(`Email: ${user?.email || "N/A"}`, 45, colY + 30)
      .text(`Vehicle: ${vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model}` : "Registered Vehicle"}`, 45, colY + 42)
      .text(`VIN: ${vehicle?.vin || "N/A"}`, 45, colY + 54)
      .text(`Color: ${vehicle?.color || "N/A"}`, 45, colY + 66);

    // Right Column: Incident & Damage Evaluation
    doc
      .fillColor(primaryNavy)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Incident & Adjudication Details", 300, colY);

    const incidentDateStr = claim.date
      ? new Date(claim.date).toLocaleDateString()
      : "Stated Incident Date";

    doc
      .fillColor(darkGray)
      .fontSize(9)
      .font("Helvetica")
      .text(`Incident Type: ${claim.type || "Collision / Accident"}`, 300, colY + 18)
      .text(`Incident Date: ${incidentDateStr}`, 300, colY + 30)
      .text(`Incident Location: ${claim.details?.location || "Reported Location"}`, 300, colY + 42)
      .text(`Repair Shop: ${claim.details?.customShopName || "Certified Preferred Garage"}`, 300, colY + 54)
      .text(`Claim Determination: Approved by Senior Adjuster`, 300, colY + 66);

    // 5. Incident Damage Statement
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(45, colY + 85)
      .lineTo(550, colY + 85)
      .stroke();

    doc
      .fillColor(primaryNavy)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Incident Statement & Description:", 45, colY + 95);

    doc
      .fillColor(darkGray)
      .fontSize(8.5)
      .font("Helvetica")
      .text(
        claim.reason || claim.details?.description || "No additional description recorded.",
        45,
        colY + 110,
        { width: 505, align: "justify" }
      );

    // 6. Adjuster Official Assessment Remarks
    if (claim.details?.adjusterNotes || claim.adjusterNotes) {
      const notes = claim.details?.adjusterNotes || claim.adjusterNotes;
      doc
        .roundedRect(45, colY + 155, 505, 45, 6)
        .fillAndStroke("#eff6ff", "#bfdbfe");

      doc
        .fillColor(brandBlue)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Claims Adjuster Assessment Remarks:", 55, colY + 163);

      doc
        .fillColor(darkGray)
        .fontSize(8.5)
        .font("Helvetica")
        .text(`"${notes}"`, 55, colY + 176, { width: 485 });
    }

    // 7. Policy Coverage Impact
    const policyLimit = Number(policy?.coverageAmount || 0);
    doc
      .fillColor(primaryNavy)
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .text("Policy Coverage Summary:", 45, 480);

    doc
      .fillColor(darkGray)
      .fontSize(8.5)
      .font("Helvetica")
      .text(`• Total Annual Policy Coverage Limit: $${policyLimit > 0 ? policyLimit.toLocaleString() : "Full Coverage"}`, 50, 495)
      .text(`• Approved Settlement Deduction: $${payoutAmount}`, 50, 508)
      .text(`• Remaining Active Coverage: $${Math.max(0, policyLimit - Number(claim.amount || 0)).toLocaleString()}`, 50, 521);

    // 8. Signatures & Official Stamp
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(45, 550)
      .lineTo(550, 550)
      .stroke();

    doc
      .fillColor(lightMuted)
      .fontSize(8)
      .font("Helvetica")
      .text("Authorized by Claims Adjudication Department", 45, 565)
      .text("VIMS Underwriting Syndicate", 45, 577);

    doc
      .fillColor(primaryNavy)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("ELECTRONICALLY VERIFIED", 400, 565, { align: "right" });

    doc
      .fillColor(lightMuted)
      .fontSize(7.5)
      .font("Helvetica")
      .text(`Security Hash: VIMS-${claim.id.replace(/[^a-zA-Z0-9]/g, "")}`, 400, 577, { align: "right" });

    // 9. Footer
    doc
      .fillColor("#94a3b8")
      .fontSize(7.5)
      .text(
        "This official settlement notice confirms authorized reimbursement under your vehicle insurance policy. For assistance, contact support@vims.com or call +251 9XX XXX XXX.",
        45,
        740,
        { align: "center", width: 505 }
      );

    doc.flushPages();
    doc.end();
  });
};

function claimmentSafe(str) {
  return str && str.trim().length > 0 ? str : "Valued Customer";
}
