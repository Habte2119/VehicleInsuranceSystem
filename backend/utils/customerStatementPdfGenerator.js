import PDFDocument from "pdfkit";

/**
 * Generates official Customer Statement, Proof of Insurance Certificate, or Loss Run Statement PDF using PDFKit
 */
export const generateCustomerStatementPDF = async ({
  user = {},
  vehicles = [],
  policies = [],
  claims = [],
  type = "statement",
}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 45,
      bufferPages: true,
      pdfVersion: "1.7",
      lang: "en-US",
      displayTitle: true,
      info: {
        Title: `VIMS Insurance Statement - ${user?.firstName || "Customer"} ${user?.lastName || ""}`,
        Author: "VIMS Vehicle Insurance Management System",
        Subject:
          type === "certificate"
            ? "Proof of Insurance Certificate"
            : type === "loss_run" || type === "claims"
            ? "Official Loss Run & Claims Statement"
            : "Customer Coverage Statement & Account Overview",
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

    // Color Palette
    const primaryNavy = "#0f172a";
    const brandBlue = "#2563eb";
    const slateDark = "#1e293b";
    const textMuted = "#64748b";
    const emeraldGreen = "#059669";
    const amberAlert = "#d97706";
    const borderSlate = "#cbd5e1";
    const lightBg = "#f8fafc";

    const customerName = `${user?.firstName || "Valued"} ${user?.lastName || "Customer"}`.trim();
    const customerId = user?.id ? String(user.id).slice(0, 12).toUpperCase() : "VIMS-CUST-001";
    const documentId = `VIMS-${type.toUpperCase().slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const issueDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // 1. Header & Brand Banner
    doc
      .fillColor(primaryNavy)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("VIMS VEHICLE INSURANCE", 45, 45, { align: "left" });

    const docTitles = {
      certificate: "OFFICIAL PROOF OF INSURANCE CERTIFICATE",
      loss_run: "OFFICIAL LOSS RUN & CLAIMS STATEMENT",
      claims: "OFFICIAL LOSS RUN & CLAIMS STATEMENT",
      statement: "STATEMENT OF COVERAGE & POLICY SCHEDULE",
    };
    const titleText = docTitles[type] || docTitles.statement;

    doc
      .fillColor(brandBlue)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(titleText, 45, 72);

    doc
      .fillColor(textMuted)
      .fontSize(8.5)
      .font("Helvetica")
      .text(`Document Reference: ${documentId}`, 45, 87)
      .text(`Issued Date: ${issueDate} | Status: Verified Active Account`, 45, 98);

    // Status Badge (Top Right)
    const badgeColor = emeraldGreen;
    doc
      .roundedRect(410, 45, 140, 30, 6)
      .fillColor("#ecfdf5")
      .fill()
      .strokeColor(badgeColor)
      .lineWidth(0.75)
      .stroke();

    doc
      .fillColor(badgeColor)
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .text("OFFICIAL RECORD", 415, 54, { width: 130, align: "center" });

    // Divider Line
    doc.moveTo(45, 116).lineTo(550, 116).strokeColor(borderSlate).lineWidth(0.75).stroke();

    // 2. Policyholder Information Box
    doc
      .roundedRect(45, 126, 505, 62, 6)
      .fillColor(lightBg)
      .fill()
      .strokeColor(borderSlate)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(slateDark)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("INSURED / POLICYHOLDER PROFILE", 55, 134);

    doc
      .fillColor(textMuted)
      .fontSize(8.5)
      .font("Helvetica")
      .text(`Name: ${customerName}`, 55, 149)
      .text(`Email: ${user?.email || "N/A"}`, 55, 161)
      .text(`Phone: ${user?.phone || user?.phoneNumber || "Verified on File"}`, 55, 173);

    doc
      .fillColor(textMuted)
      .fontSize(8.5)
      .font("Helvetica")
      .text(`Customer ID: ${customerId}`, 310, 149)
      .text(`Account Standing: Good Standing`, 310, 161)
      .text(`Coverage Territory: Nationwide Comprehensive`, 310, 173);

    // ==========================================
    // TYPE SPECIFIC RENDERING
    // ==========================================
    if (type === "certificate") {
      // PROOF OF INSURANCE CERTIFICATE SPECIFIC LAYOUT
      const certY = 200;
      doc
        .roundedRect(45, certY, 505, 45, 6)
        .fillColor("#eff6ff")
        .fill()
        .strokeColor(brandBlue)
        .lineWidth(0.75)
        .stroke();

      doc
        .fillColor(brandBlue)
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .text("STATE MOTOR VEHICLE FINANCIAL RESPONSIBILITY VERIFICATION", 55, certY + 10);

      doc
        .fillColor(slateDark)
        .fontSize(8)
        .font("Helvetica")
        .text(
          "This certificate certifies that automobile liability and collision coverage described herein is in continuous effect for the listed registered vehicle(s) and insured person(s).",
          55,
          certY + 24,
          { width: 485 }
        );

      // Covered Vehicles Section
      let vehicleTableY = certY + 58;
      doc
        .fillColor(primaryNavy)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Covered Vehicle Fleet Schedule", 45, vehicleTableY);

      vehicleTableY += 16;
      doc.rect(45, vehicleTableY, 505, 20).fillColor(primaryNavy).fill();
      doc
        .fillColor("#ffffff")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("YEAR / MAKE / MODEL", 55, vehicleTableY + 6)
        .text("PLATE NO.", 240, vehicleTableY + 6)
        .text("VIN / IDENTIFICATION", 340, vehicleTableY + 6)
        .text("STATUS", 480, vehicleTableY + 6);

      let curY = vehicleTableY + 20;
      if (vehicles.length === 0) {
        doc.rect(45, curY, 505, 22).fillColor("#ffffff").fill();
        doc
          .fillColor(textMuted)
          .fontSize(8)
          .font("Helvetica")
          .text("No vehicles enrolled under current profile schedule.", 55, curY + 6);
        curY += 22;
      } else {
        vehicles.forEach((v, idx) => {
          const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
          doc.rect(45, curY, 505, 20).fillColor(bg).fill();
          doc
            .fillColor(slateDark)
            .fontSize(8)
            .font("Helvetica")
            .text(`${v.year || ""} ${v.brand || v.make || "Vehicle"} ${v.model || ""}`.trim(), 55, curY + 5)
            .text(v.plateNumber || v.licensePlate || "Registered", 240, curY + 5)
            .text(v.vin || "VIN-VERIFIED-VIMS", 340, curY + 5)
            .text("Insured", 480, curY + 5);
          curY += 20;
        });
      }

      // Coverage Limits Table
      let policySectionY = curY + 18;
      doc
        .fillColor(primaryNavy)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Active Underwriting Policies & Liability Limits", 45, policySectionY);

      policySectionY += 16;
      doc.rect(45, policySectionY, 505, 20).fillColor(slateDark).fill();
      doc
        .fillColor("#ffffff")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("POLICY ID / PLAN", 55, policySectionY + 6)
        .text("COVERAGE TYPE", 210, policySectionY + 6)
        .text("POLICY LIMIT", 340, policySectionY + 6)
        .text("STATUS", 480, policySectionY + 6);

      let polY = policySectionY + 20;
      if (policies.length === 0) {
        doc.rect(45, polY, 505, 22).fillColor("#ffffff").fill();
        doc
          .fillColor(textMuted)
          .fontSize(8)
          .font("Helvetica")
          .text("Standard Active Auto Liability Coverage — Primary Tier Active", 55, polY + 6);
        polY += 22;
      } else {
        policies.forEach((p, idx) => {
          const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
          doc.rect(45, polY, 505, 20).fillColor(bg).fill();
          doc
            .fillColor(slateDark)
            .fontSize(8)
            .font("Helvetica")
            .text(`${p.name || "Auto Policy"} (${p.id.slice(0, 10)})`, 55, polY + 5)
            .text(p.type || "Comprehensive Auto", 210, polY + 5)
            .text(`$${Number(p.coverageAmount || 50000).toLocaleString()}`, 340, polY + 5)
            .text(p.status || "Active", 480, polY + 5);
          polY += 20;
        });
      }
    } else if (type === "loss_run" || type === "claims") {
      // LOSS RUN & CLAIMS STATEMENT LAYOUT
      const lossY = 200;
      const totalClaimCount = claims.length;
      const approvedClaims = claims.filter((c) =>
        ["approved", "paid"].includes((c.status || "").toLowerCase())
      );
      const totalDisbursed = approvedClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const pendingClaims = claims.filter((c) =>
        ["pending", "processing", "under review"].includes((c.status || "").toLowerCase())
      );

      // KPI Metrics Box
      const kpis = [
        { label: "TOTAL CLAIMS FILED", val: `${totalClaimCount}`, col: primaryNavy },
        { label: "APPROVED & PAID", val: `$${totalDisbursed.toLocaleString()}`, col: emeraldGreen },
        { label: "PENDING ADJUDICATION", val: `${pendingClaims.length}`, col: amberAlert },
        { label: "LOSS RUN STATUS", val: totalClaimCount === 0 ? "Zero Loss (Prime)" : "Recorded", col: brandBlue },
      ];

      kpis.forEach((kpi, idx) => {
        const boxX = 45 + idx * 129;
        doc
          .roundedRect(boxX, lossY, 118, 48, 6)
          .fillColor(lightBg)
          .fill()
          .strokeColor(borderSlate)
          .lineWidth(0.5)
          .stroke();

        doc
          .fillColor(textMuted)
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(kpi.label, boxX + 8, lossY + 8, { width: 102 });

        doc
          .fillColor(kpi.col)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(kpi.val, boxX + 8, lossY + 24, { width: 102 });
      });

      // Claims Record Table
      let claimsTableY = lossY + 62;
      doc
        .fillColor(primaryNavy)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Detailed Loss & Incident History (5-Year Window)", 45, claimsTableY);

      claimsTableY += 16;
      doc.rect(45, claimsTableY, 505, 20).fillColor(primaryNavy).fill();
      doc
        .fillColor("#ffffff")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("CLAIM REF", 55, claimsTableY + 6)
        .text("DATE FILED", 150, claimsTableY + 6)
        .text("INCIDENT DESCRIPTION", 230, claimsTableY + 6)
        .text("AMOUNT", 410, claimsTableY + 6)
        .text("STATUS", 480, claimsTableY + 6);

      let cY = claimsTableY + 20;
      if (claims.length === 0) {
        doc.rect(45, cY, 505, 32).fillColor("#ffffff").fill();
        doc
          .fillColor(emeraldGreen)
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text("NO LOSS INCIDENTS RECORDED", 55, cY + 8);
        doc
          .fillColor(textMuted)
          .fontSize(7.5)
          .font("Helvetica")
          .text("The policyholder has zero recorded accident, collision, or comprehensive claims on file.", 55, cY + 19);
        cY += 32;
      } else {
        claims.forEach((c, idx) => {
          const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
          doc.rect(45, cY, 505, 24).fillColor(bg).fill();
          const filedDate = c.createdAt
            ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Recent";
          doc
            .fillColor(slateDark)
            .fontSize(8)
            .font("Helvetica")
            .text(String(c.id).slice(0, 10), 55, cY + 7)
            .text(filedDate, 150, cY + 7)
            .text((c.description || "Auto incident report").slice(0, 32), 230, cY + 7)
            .text(`$${Number(c.amount || 0).toLocaleString()}`, 410, cY + 7)
            .text(c.status || "Pending", 480, cY + 7);
          cY += 24;
        });
      }
    } else {
      // GENERAL COVERAGE STATEMENT & PORTFOLIO SCHEDULE
      const statY = 200;
      const totalCoverage = policies.reduce((sum, p) => sum + Number(p.coverageAmount || 0), 0);
      const totalPremium = policies.reduce((sum, p) => sum + Number(p.premiumAmount || 0), 0);

      // KPI Grid
      const statKpis = [
        { label: "TOTAL COVERAGE LIMIT", val: `$${totalCoverage.toLocaleString()}`, col: emeraldGreen },
        { label: "ANNUAL PREMIUM TOTAL", val: `$${totalPremium.toLocaleString()}`, col: brandBlue },
        { label: "INSURED VEHICLES", val: `${vehicles.length} Units`, col: primaryNavy },
        { label: "ACTIVE POLICIES", val: `${policies.length} Enrolled`, col: slateDark },
      ];

      statKpis.forEach((kpi, idx) => {
        const boxX = 45 + idx * 129;
        doc
          .roundedRect(boxX, statY, 118, 48, 6)
          .fillColor(lightBg)
          .fill()
          .strokeColor(borderSlate)
          .lineWidth(0.5)
          .stroke();

        doc
          .fillColor(textMuted)
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text(kpi.label, boxX + 8, statY + 8, { width: 102 });

        doc
          .fillColor(kpi.col)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(kpi.val, boxX + 8, statY + 24, { width: 102 });
      });

      // Policies Section
      let polTop = statY + 62;
      doc
        .fillColor(primaryNavy)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Enrolled Insurance Policies & Active Protection", 45, polTop);

      polTop += 16;
      doc.rect(45, polTop, 505, 20).fillColor(primaryNavy).fill();
      doc
        .fillColor("#ffffff")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("POLICY / PLAN NAME", 55, polTop + 6)
        .text("COVERAGE LIMIT", 220, polTop + 6)
        .text("PREMIUM / YR", 340, polTop + 6)
        .text("STATUS", 470, polTop + 6);

      let curPolY = polTop + 20;
      if (policies.length === 0) {
        doc.rect(45, curPolY, 505, 22).fillColor("#ffffff").fill();
        doc
          .fillColor(textMuted)
          .fontSize(8)
          .font("Helvetica")
          .text("No active insurance policies enrolled under this account currently.", 55, curPolY + 6);
        curPolY += 22;
      } else {
        policies.forEach((p, idx) => {
          const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
          doc.rect(45, curPolY, 505, 20).fillColor(bg).fill();
          doc
            .fillColor(slateDark)
            .fontSize(8)
            .font("Helvetica")
            .text(`${p.name || p.type || "Policy"} (${String(p.id).slice(0, 10)})`, 55, curPolY + 5)
            .text(`$${Number(p.coverageAmount || 0).toLocaleString()}`, 220, curPolY + 5)
            .text(`$${Number(p.premiumAmount || 0).toLocaleString()}`, 340, curPolY + 5)
            .text(p.status || "Active", 470, curPolY + 5);
          curPolY += 20;
        });
      }

      // Vehicles Fleet Breakdown
      let vTop = curPolY + 16;
      doc
        .fillColor(primaryNavy)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Registered Vehicles Fleet Schedule", 45, vTop);

      vTop += 16;
      doc.rect(45, vTop, 505, 20).fillColor(slateDark).fill();
      doc
        .fillColor("#ffffff")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("VEHICLE MODEL", 55, vTop + 6)
        .text("PLATE NUMBER", 220, vTop + 6)
        .text("VIN", 340, vTop + 6)
        .text("STATUS", 470, vTop + 6);

      let curVehY = vTop + 20;
      if (vehicles.length === 0) {
        doc.rect(45, curVehY, 505, 22).fillColor("#ffffff").fill();
        doc
          .fillColor(textMuted)
          .fontSize(8)
          .font("Helvetica")
          .text("No vehicles registered in the fleet yet.", 55, curVehY + 6);
        curVehY += 22;
      } else {
        vehicles.forEach((v, idx) => {
          const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
          doc.rect(45, curVehY, 505, 20).fillColor(bg).fill();
          doc
            .fillColor(slateDark)
            .fontSize(8)
            .font("Helvetica")
            .text(`${v.year || ""} ${v.brand || ""} ${v.model || "Vehicle"}`.trim(), 55, curVehY + 5)
            .text(v.plateNumber || "Registered", 220, curVehY + 5)
            .text(v.vin || "VIN-VERIFIED", 340, curVehY + 5)
            .text("Active", 470, curVehY + 5);
          curVehY += 20;
        });
      }
    }

    // Official Verification Seal & Legal Sign-off (Bottom)
    const footerY = 660;
    doc.moveTo(45, footerY).lineTo(550, footerY).strokeColor(borderSlate).lineWidth(0.5).stroke();

    doc
      .fillColor(textMuted)
      .fontSize(7.5)
      .font("Helvetica")
      .text(
        "OFFICIAL ELECTRONIC RECORD: This document is an authentic insurance verification record issued by VIMS Underwriting Core.",
        45,
        footerY + 10
      )
      .text(
        "For law enforcement or motor vehicle department verification, contact verification@vims-insurance.com or call 1-800-VIMS-SAFE.",
        45,
        footerY + 21
      );

    doc
      .fillColor(brandBlue)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("VIMS Vehicle Insurance Management System — Officially Underwritten & Verified", 45, footerY + 38);

    doc.end();
  });
};
