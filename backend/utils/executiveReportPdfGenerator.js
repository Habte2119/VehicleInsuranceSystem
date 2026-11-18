import PDFDocument from "pdfkit";

/**
 * Generates an executive insurance audit/analytics report PDF using PDFKit
 */
export const generateExecutiveReportPDF = async (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 45,
      bufferPages: true,
      pdfVersion: "1.7",
      lang: "en-US",
      displayTitle: true,
      info: {
        Title: `VIMS Executive Report - ${reportData.title || "Analytics Audit"}`,
        Author: "VIMS Underwriting & Risk Management",
        Subject: "Insurance Portfolio & Claims Analytics Report",
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

    // 1. Header Banner
    doc
      .fillColor(primaryNavy)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("VIMS INSURANCE PLATFORM", 45, 45, { align: "left" });

    doc
      .fillColor(brandBlue)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("EXECUTIVE AUDIT & ANALYTICS REPORT", 45, 70);

    doc
      .fillColor(textMuted)
      .fontSize(9)
      .font("Helvetica")
      .text(`Report ID: ${reportData.id || "RPT-AUDIT-001"}`, 45, 84)
      .text(`Generated Date: ${new Date(reportData.generatedDate || Date.now()).toLocaleString()}`, 45, 96);

    // Horizontal Rule
    doc.moveTo(45, 115).lineTo(550, 115).strokeColor(borderSlate).lineWidth(1).stroke();

    // 2. Report Overview Box
    doc
      .roundedRect(45, 125, 505, 55, 6)
      .fillColor("#f8fafc")
      .fill()
      .strokeColor(borderSlate)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(slateDark)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(reportData.title || "Portfolio Performance Summary", 60, 135);

    doc
      .fillColor(textMuted)
      .fontSize(9)
      .font("Helvetica")
      .text(
        reportData.remarks ||
          "Automated financial overview capturing portfolio coverage, active claims, loss ratio, and net premiums collected.",
        60,
        152,
        { width: 475 }
      );

    // 3. KPI Grid (4 Metrics)
    const kpiY = 195;
    const metrics = [
      {
        label: "Total Premium Collected",
        value: `$${Number(reportData.metrics?.totalPremiumCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        color: emeraldGreen,
      },
      {
        label: "Claims Payout Incurred",
        value: `$${Number(reportData.metrics?.totalClaimsPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        color: amberAlert,
      },
      {
        label: "Loss Ratio",
        value: `${reportData.metrics?.lossRatio || "0.0"}%`,
        color: brandBlue,
      },
      {
        label: "Active Policies",
        value: `${reportData.metrics?.activePoliciesCount || 0}`,
        color: primaryNavy,
      },
    ];

    const boxWidth = 118;
    metrics.forEach((m, i) => {
      const boxX = 45 + i * (boxWidth + 11);
      doc
        .roundedRect(boxX, kpiY, boxWidth, 50, 6)
        .fillColor("#f1f5f9")
        .fill()
        .strokeColor(borderSlate)
        .lineWidth(0.5)
        .stroke();

      doc
        .fillColor(textMuted)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(m.label.toUpperCase(), boxX + 8, kpiY + 10, { width: boxWidth - 16 });

      doc
        .fillColor(m.color)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(m.value, boxX + 8, kpiY + 26, { width: boxWidth - 16 });
    });

    // 4. Claims Adjudication Breakdown Table
    const tableTop = 265;
    doc
      .fillColor(primaryNavy)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Claims Adjudication Summary", 45, tableTop);

    // Table Header
    const rowY = tableTop + 20;
    doc
      .rect(45, rowY, 505, 22)
      .fillColor(primaryNavy)
      .fill();

    doc
      .fillColor("#ffffff")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("STATUS", 55, rowY + 7)
      .text("COUNT", 175, rowY + 7)
      .text("VOLUME %", 295, rowY + 7)
      .text("TOTAL DISBURSED / ESTIMATED", 390, rowY + 7);

    const claimsBreakdown = reportData.claimsSummary || [
      { status: "Approved & Paid", count: reportData.metrics?.approvedClaimsCount || 0, percent: "45%", amount: `$${reportData.metrics?.totalClaimsPayout || 0}` },
      { status: "Pending / Under Review", count: reportData.metrics?.pendingClaimsCount || 0, percent: "35%", amount: `$${reportData.metrics?.pendingAmount || 0}` },
      { status: "Rejected / Denied", count: reportData.metrics?.rejectedClaimsCount || 0, percent: "20%", amount: "$0.00" },
    ];

    let currentY = rowY + 22;
    claimsBreakdown.forEach((row, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      doc.rect(45, currentY, 505, 20).fillColor(bg).fill();

      doc
        .fillColor(slateDark)
        .fontSize(8.5)
        .font("Helvetica")
        .text(row.status, 55, currentY + 5)
        .text(String(row.count), 175, currentY + 5)
        .text(row.percent || "-", 295, currentY + 5)
        .text(row.amount || "$0.00", 390, currentY + 5);

      currentY += 20;
    });

    // 5. Policy Portfolio Distribution
    const policyTop = currentY + 25;
    doc
      .fillColor(primaryNavy)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Policy Portfolio Tier Distribution", 45, policyTop);

    const polHeaderY = policyTop + 20;
    doc.rect(45, polHeaderY, 505, 22).fillColor(slateDark).fill();

    doc
      .fillColor("#ffffff")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("TIER / PLAN", 55, polHeaderY + 7)
      .text("ACTIVE POLICIES", 220, polHeaderY + 7)
      .text("ESTIMATED REVENUE", 390, polHeaderY + 7);

    const policyTiers = reportData.policyDistribution || [
      { name: "Comprehensive Shield", count: 12, revenue: "$18,400.00" },
      { name: "Collision Protection", count: 8, revenue: "$7,600.00" },
      { name: "Third-Party Liability", count: 5, revenue: "$2,450.00" },
    ];

    let polY = polHeaderY + 22;
    policyTiers.forEach((tier, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      doc.rect(45, polY, 505, 20).fillColor(bg).fill();

      doc
        .fillColor(slateDark)
        .fontSize(8.5)
        .font("Helvetica")
        .text(tier.name, 55, polY + 5)
        .text(String(tier.count), 220, polY + 5)
        .text(tier.revenue, 390, polY + 5);

      polY += 20;
    });

    // 6. Sign-off & Audit Seal
    const footerY = 660;
    doc.moveTo(45, footerY).lineTo(550, footerY).strokeColor(borderSlate).lineWidth(0.5).stroke();

    doc
      .fillColor(textMuted)
      .fontSize(8)
      .font("Helvetica")
      .text("CONFIDENTIALITY NOTICE: This document contains proprietary audit and operational metrics for VIMS Insurance Inc.", 45, footerY + 12)
      .text("Official electronic verification record. Certified by VIMS Core Adjudication Subsystem.", 45, footerY + 24);

    doc
      .fillColor(brandBlue)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("VIMS Underwriting System — Verified", 45, footerY + 45);

    doc.end();
  });
};
