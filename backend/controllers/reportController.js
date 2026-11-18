import { prisma } from "../config/db.js";
import { generateReportId } from "../utils/idGenerator.js";
import { generateExecutiveReportPDF } from "../utils/executiveReportPdfGenerator.js";
import { generateCustomerStatementPDF } from "../utils/customerStatementPdfGenerator.js";

/**
 * Computes live insurance performance KPIs across claims, policies, and payments
 */
export const getAnalyticsSummary = async (req, res) => {
  try {
    // 1. Policies breakdown
    const policies = await prisma.policy.findMany({
      select: { id: true, status: true, coverageAmount: true, premiumAmount: true, type: true },
    });
    const totalPolicies = policies.length;
    const activePolicies = policies.filter((p) => (p.status || "").toLowerCase() === "active");
    const activePoliciesCount = activePolicies.length;

    // 2. Payments (Premiums collected)
    const payments = await prisma.payment.findMany({
      select: { amount: true, status: true },
    });
    const totalPremiumCollected = payments
      .filter((p) => ["completed", "paid", "success"].includes((p.status || "").toLowerCase()))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // 3. Claims adjudication
    const claims = await prisma.claim.findMany({
      select: { id: true, status: true, amount: true, type: true, createdAt: true },
    });
    const totalClaims = claims.length;

    const approvedClaims = claims.filter((c) =>
      ["approved", "paid"].includes((c.status || "").toLowerCase())
    );
    const pendingClaims = claims.filter((c) =>
      ["pending", "processing", "under_review", "under review"].includes((c.status || "").toLowerCase())
    );
    const rejectedClaims = claims.filter((c) =>
      ["rejected", "denied"].includes((c.status || "").toLowerCase())
    );

    const totalClaimsPayout = approvedClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const pendingAmount = pendingClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // 4. Loss Ratio: (Incurred Claims Payout / Total Premium Collected) * 100
    const lossRatio =
      totalPremiumCollected > 0
        ? ((totalClaimsPayout / totalPremiumCollected) * 100).toFixed(1)
        : "0.0";

    // 5. Policy Type breakdown
    const typeCounts = {};
    policies.forEach((p) => {
      const t = p.type || "Standard";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    // 6. Registered Customers & Vehicles count
    const totalCustomers = await prisma.user.count({
      where: { role: "CUSTOMER" },
    });
    const totalVehicles = await prisma.vehicle.count();

    res.status(200).json({
      success: true,
      metrics: {
        totalPolicies,
        activePoliciesCount,
        totalCustomers,
        totalVehicles,
        totalPremiumCollected,
        totalClaims,
        approvedClaimsCount: approvedClaims.length,
        pendingClaimsCount: pendingClaims.length,
        rejectedClaimsCount: rejectedClaims.length,
        totalClaimsPayout,
        pendingAmount,
        lossRatio,
        policyTypeBreakdown: typeCounts,
      },
    });
  } catch (error) {
    console.error("Error computing analytics summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate analytics summary",
      error: error.message,
    });
  }
};

/**
 * Returns saved generated reports from the database
 */
export const getReportsList = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { generatedDate: "desc" },
      include: {
        admin: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error listing reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports list",
    });
  }
};

/**
 * Generates and stores a new audit report snapshot in the database
 */
export const generateReport = async (req, res) => {
  try {
    const adminId = req.user?.id || req.userId || null;
    const { type = "FINANCIAL_LOSS_RATIO", remarks = "", format = "PDF" } = req.body;

    // Fetch snapshot metrics
    const policies = await prisma.policy.findMany();
    const payments = await prisma.payment.findMany();
    const claims = await prisma.claim.findMany();

    const activePoliciesCount = policies.filter(
      (p) => (p.status || "").toLowerCase() === "active"
    ).length;
    const totalPremiumCollected = payments
      .filter((p) => ["completed", "paid", "success"].includes((p.status || "").toLowerCase()))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const approvedClaims = claims.filter((c) =>
      ["approved", "paid"].includes((c.status || "").toLowerCase())
    );
    const totalClaimsPayout = approvedClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const lossRatio =
      totalPremiumCollected > 0
        ? ((totalClaimsPayout / totalPremiumCollected) * 100).toFixed(1)
        : "0.0";

    const snapshotContent = JSON.stringify({
      generatedAt: new Date().toISOString(),
      title: `${type.replace(/_/g, " ")} Summary`,
      remarks: remarks || `Automated audit generated on ${new Date().toLocaleDateString()}`,
      metrics: {
        totalPoliciesCount: policies.length,
        activePoliciesCount,
        totalPremiumCollected,
        totalClaimsCount: claims.length,
        approvedClaimsCount: approvedClaims.length,
        totalClaimsPayout,
        lossRatio,
      },
    });

    const newReport = await prisma.report.create({
      data: {
        id: generateReportId(),
        type,
        generatedDate: new Date(),
        content: snapshotContent,
        format,
        remarks: remarks || null,
        adminId: adminId || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Report generated successfully",
      report: newReport,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create report snapshot",
      error: error.message,
    });
  }
};

/**
 * Generates and downloads the Official PDF report
 */
export const downloadReportPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    let snapshot = null;
    if (report && report.content) {
      try {
        snapshot = JSON.parse(report.content);
      } catch (e) {
        snapshot = null;
      }
    }

    // If no existing saved snapshot, compile live metrics
    if (!snapshot) {
      const policies = await prisma.policy.findMany();
      const payments = await prisma.payment.findMany();
      const claims = await prisma.claim.findMany();

      const totalPremiumCollected = payments
        .filter((p) => ["completed", "paid", "success"].includes((p.status || "").toLowerCase()))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const approvedClaims = claims.filter((c) =>
        ["approved", "paid"].includes((c.status || "").toLowerCase())
      );
      const totalClaimsPayout = approvedClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const lossRatio =
        totalPremiumCollected > 0
          ? ((totalClaimsPayout / totalPremiumCollected) * 100).toFixed(1)
          : "0.0";

      snapshot = {
        id: report?.id || id || "RPT-AUDIT-001",
        title: report?.type ? `${report.type.replace(/_/g, " ")} Summary` : "Executive Underwriting Audit",
        generatedDate: report?.generatedDate || new Date(),
        remarks: report?.remarks || "On-demand system audit and operational underwriting overview.",
        metrics: {
          totalPremiumCollected,
          totalClaimsPayout,
          lossRatio,
          activePoliciesCount: policies.filter((p) => (p.status || "").toLowerCase() === "active").length,
          approvedClaimsCount: approvedClaims.length,
          pendingClaimsCount: claims.filter((c) => ["pending", "processing"].includes((c.status || "").toLowerCase())).length,
          rejectedClaimsCount: claims.filter((c) => ["rejected", "denied"].includes((c.status || "").toLowerCase())).length,
        },
      };
    } else {
      snapshot.id = report.id;
      snapshot.generatedDate = report.generatedDate;
    }

    const pdfBuffer = await generateExecutiveReportPDF(snapshot);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="VIMS-Audit-Report-${snapshot.id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating report PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report PDF",
      error: error.message,
    });
  }
};

/**
 * Generates and downloads Customer Statement, Proof of Insurance Certificate, or Loss Run Statement
 */
export const downloadCustomerStatementPDF = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.query.userId;
    const type = req.query.type || "statement";

    let user = null;
    let vehicles = [];
    let policies = [];
    let claims = [];

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          phoneNumber: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      });

      vehicles = await prisma.vehicle.findMany({
        where: { userId },
      });

      policies = await prisma.policy.findMany({
        where: { customerId: userId },
      });

      claims = await prisma.claim.findMany({
        where: { customerId: userId },
      });
    }

    // Fallback if accessed by admin or test session
    if (!user) {
      user = {
        id: "CUST-DEFAULT",
        firstName: req.user?.firstName || "Valued",
        lastName: req.user?.lastName || "Customer",
        email: req.user?.email || "customer@vims-insurance.com",
        phone: "+1 (800) 555-0199",
      };
    }

    const pdfBuffer = await generateCustomerStatementPDF({
      user,
      vehicles,
      policies,
      claims,
      type,
    });

    const filenameMap = {
      certificate: `VIMS-Proof-of-Insurance-${user.id || "Account"}.pdf`,
      loss_run: `VIMS-Loss-Run-Statement-${user.id || "Account"}.pdf`,
      claims: `VIMS-Loss-Run-Statement-${user.id || "Account"}.pdf`,
      statement: `VIMS-Coverage-Statement-${user.id || "Account"}.pdf`,
    };
    const filename = filenameMap[type] || filenameMap.statement;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating customer statement PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate statement PDF",
      error: error.message,
    });
  }
};

/**
 * Delete a report record
 */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.report.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, message: "Failed to delete report" });
  }
};
