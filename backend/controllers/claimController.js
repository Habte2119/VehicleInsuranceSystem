// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();


import { prisma } from "../config/db.js"; //new added to check
import { generateSettlementPDF } from "../utils/settlementPdfGenerator.js";
import { createNotificationHelper } from "./notificationController.js";

// POST /api/claims

import { generateClaimId } from "../utils/idGenerator.js"; // Import your ID generator

// POST /api/claims
// export const createClaim = async (req, res) => {
//   try {
//     const {
//       type,
//       incidentDate,
//       incidentTime,
//       location,
//       description,
//       policyId,
//       currentMileage,
//       usePreferredShop,
//       customShopName,
//       customShopAddress,
//       contactPhone,
//       contactEmail,
//       supportingDocuments,
//     } = req.body;

//     // Validate required fields
//     if (
//       !type ||
//       !incidentDate ||
//       !incidentTime ||
//       !location ||
//       !description ||
//       !policyId
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     // Verify the policy exists and belongs to the user
//     const policy = await prisma.policy.findUnique({
//       where: { id: policyId },
//       include: { vehicle: true, customer: true },
//     });

//     if (!policy) {
//       return res.status(404).json({
//         success: false,
//         message: "Policy not found",
//       });
//     }

//     if (policy.customerId !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to file a claim for this policy",
//       });
//     }

//     // Generate a unique claim ID
//     const claimId = generateClaimId();

//     // Create the claim in the database
//     const newClaim = await prisma.claim.create({
//       data: {
//         id: claimId, // Assign the generated claim ID
//         type,
//         status: "pending", // Default status for new claims
//         supportingDocument: supportingDocuments?.join(", "), // Store document names as a comma-separated string
//         date: new Date(`${incidentDate}T${incidentTime}:00Z`), // Combine date and time
//         reason: description,
//         amount: 0, // Placeholder amount (can be updated later)
//         customerId: req.user.id,
//         vehicleId: policy.vehicleId,
//         policyId: policy.id,
//         details: {
//           currentMileage,
//           usePreferredShop,
//           customShopName,
//           customShopAddress,
//           contactPhone,
//           contactEmail,
//         },
//       },
//     });

//     res.status(201).json({
//       success: true,
//       message: "Claim submitted successfully",
//       claim: newClaim,
//     });
//   } catch (error) {
//     console.error("Error creating claim:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to submit claim",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };
// import { sendAdminNotification } from "../service/notificationService.js";
// export const createClaim = async (req, res) => {
//   try {
//     const {
//       type,
//       incidentDate,
//       incidentTime,
//       location,
//       description,
//       policyId,
//       currentMileage,
//       usePreferredShop,
//       customShopName,
//       customShopAddress,
//       contactPhone,
//       contactEmail,
//       supportingDocuments,
//       userId, // Get userId from request body
//     } = req.body;

//     // Validate required fields
//     if (
//       !type ||
//       !incidentDate ||
//       !incidentTime ||
//       !location ||
//       !description ||
//       !policyId ||
//       !userId // Add userId to required fields
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     // Verify the policy exists and belongs to the user
//     const policy = await prisma.policy.findUnique({
//       where: { id: policyId },
//       include: { vehicle: true },
//     });

//     if (!policy) {
//       return res.status(404).json({
//         success: false,
//         message: "Policy not found",
//       });
//     }

//     // Verify the user exists
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Check if policy belongs to user (optional but recommended)
//     if (policy.customerId !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to file a claim for this policy",
//       });
//     }

//     // Generate a unique claim ID
//     const claimId = generateClaimId();

//     // Create the claim
//     const newClaim = await prisma.claim.create({
//       data: {
//         id: claimId,
//         type,
//         status: "pending",
//         supportingDocument: supportingDocuments?.join(", ") || "",
//         date: new Date(`${incidentDate}T${incidentTime}:00Z`),
//         reason: description,
//         amount: 0,
//         customerId: userId, // Use the userId from request
//         vehicleId: policy.vehicleId,
//         policyId: policy.id,
//         details: {
//           currentMileage: currentMileage || "",
//           usePreferredShop: Boolean(usePreferredShop),
//           customShopName: customShopName || "",
//           customShopAddress: customShopAddress || "",
//           contactPhone: contactPhone || "",
//           contactEmail: contactEmail || "",
//         },
//       },
//     });

//     res.status(201).json({
//       success: true,
//       message: "Claim submitted successfully",
//       claim: newClaim,
//     });
//   } catch (error) {
//     console.error("Error creating claim:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to submit claim",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
//   await sendAdminNotification({
//     id: generateNotificationId(),
//     customerId: userId,
//     title: "New Claim Submitted",
//     message: `A new ${type} claim has been submitted by ${user.firstName} ${user.lastName}`,
//     type: "claim",
//   });
// };
// controllers/claimController.ts

import { createClaimNotification } from "../service/notificationService.js";

export const createClaim = async (req, res) => {
  try {
    const {
      type,
      incidentDate,
      incidentTime,
      location,
      description,
      policyId,
      currentMileage,
      usePreferredShop,
      customShopName,
      customShopAddress,
      contactPhone,
      contactEmail,
      supportingDocuments,
      userId,
    } = req.body;

    const effectiveUserId = userId || req.user?.id || req.userId;

    // Validate required fields
    if (
      !type ||
      !incidentDate ||
      !incidentTime ||
      !location ||
      !description ||
      !policyId ||
      !effectiveUserId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify policy and user
    const [policy, user] = await Promise.all([
      prisma.policy.findUnique({
        where: { id: policyId },
        include: { vehicle: true },
      }),
      prisma.user.findUnique({
        where: { id: effectiveUserId },
      }),
    ]);

    if (!policy)
      return res
        .status(404)
        .json({ success: false, message: "Policy not found" });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const isPolicyOwner = policy.customerId === effectiveUserId || policy.vehicle?.customerId === effectiveUserId;
    if (!isPolicyOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to file a claim for this policy",
      });
    }

    // Ensure we have a valid vehicle ID for this claim
    let effectiveVehicleId = req.body.vehicleId || policy.vehicleId;
    if (!effectiveVehicleId) {
      const userVeh = await prisma.vehicle.findFirst({
        where: { customerId: effectiveUserId },
      });
      effectiveVehicleId = userVeh?.id;
    }

    if (!effectiveVehicleId) {
      return res.status(400).json({
        success: false,
        message:
          "A registered vehicle is required to file a claim. Please register your vehicle first.",
      });
    }

    // Verify vehicle belongs to user
    const vehicleRecord = await prisma.vehicle.findUnique({
      where: { id: effectiveVehicleId },
    });
    const isVehOwner = vehicleRecord && (vehicleRecord.customerId === effectiveUserId || policy.customerId === effectiveUserId);
    if (!isVehOwner) {
      return res.status(400).json({
        success: false,
        message: "The specified vehicle is not registered under your account.",
      });
    }

    // Verify policy actually covers this vehicle
    if (policy.vehicleId && policy.vehicleId !== effectiveVehicleId) {
      return res.status(400).json({
        success: false,
        message: "The selected insurance policy does not cover this vehicle.",
      });
    }

    // Count existing claims for this vehicle (Limit: 3 claims per vehicle)
    const existingVehicleClaims = await prisma.claim.count({
      where: {
        vehicleId: effectiveVehicleId,
        status: { notIn: ["rejected", "cancelled"] },
      },
    });

    const MAX_CLAIMS_PER_VEHICLE = 3;
    if (existingVehicleClaims >= MAX_CLAIMS_PER_VEHICLE) {
      return res.status(400).json({
        success: false,
        message: `Maximum claim limit (${MAX_CLAIMS_PER_VEHICLE} claims) reached for this vehicle. Please contact customer service.`,
        claimCount: existingVehicleClaims,
        maxClaims: MAX_CLAIMS_PER_VEHICLE,
      });
    }

    // Link vehicle to policy if policy didn't have vehicleId explicitly set
    if (!policy.vehicleId) {
      await prisma.policy.update({
        where: { id: policy.id },
        data: { vehicleId: effectiveVehicleId },
      });
    }

    // Parse optional initial estimated amount if provided by customer
    const parsedInitialAmount = parseFloat(req.body.amount || req.body.estimatedAmount || 0);
    const initialAmount = !isNaN(parsedInitialAmount) && parsedInitialAmount > 0 ? parsedInitialAmount : 0;

    // Create the claim
    const newClaim = await prisma.claim.create({
      data: {
        id: generateClaimId(),
        type,
        status: "pending",
        supportingDocument: supportingDocuments?.join(", ") || "",
        date: new Date(`${incidentDate}T${incidentTime}:00Z`),
        reason: description,
        amount: initialAmount,
        customerId: effectiveUserId,
        vehicleId: effectiveVehicleId,
        policyId: policy.id,
        details: {
          estimatedRepairCost: initialAmount,
          currentMileage: currentMileage || "",
          usePreferredShop: Boolean(usePreferredShop),
          customShopName: customShopName || "",
          customShopAddress: customShopAddress || "",
          contactPhone: contactPhone || "",
          contactEmail: contactEmail || "",
        },
      },
    });

    // Create customer notification
    try {
      await createNotificationHelper({
        customerId: userId,
        title: "Claim Submitted Successfully",
        message: `Your ${type} claim (${newClaim.id}) for policy ${policy.id} has been submitted and is pending review.`,
        type: "claim",
      });
    } catch (notifErr) {
      console.error("Failed to dispatch claim notification:", notifErr);
    }

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully",
      claim: newClaim,
    });
  } catch (error) {
    console.error("Error creating claim:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit claim",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ... keep your existing getUserClaims and getClaimTimeline functions ...
export const getUserClaims = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const claims = await prisma.claim.findMany({
      where: { customerId: userId },
      include: {
        vehicle: true,
        policy: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Format the claims data to match frontend structure including denial reasons and adjuster audit notes
    const formattedClaims = claims.map((claim) => {
      const details =
        typeof claim.details === "object" && claim.details !== null
          ? claim.details
          : {};

      const vehicleName = claim.vehicle
        ? `${claim.vehicle.year || ""} ${claim.vehicle.brand || ""} ${claim.vehicle.model || ""}`.trim()
        : claim.vehicle?.name || "Insured Vehicle";

      return {
        id: claim.id,
        policyId: claim.policyId,
        policyName: claim.policy?.name || "Active Policy",
        coverageAmount: claim.policy?.coverageAmount || 0,
        vehicle: vehicleName,
        vehicleId: claim.vehicleId,
        vehicleVin: claim.vehicle?.vin || "N/A",
        claimType: claim.type,
        date: claim.date.toISOString().split("T")[0],
        rawAmount: claim.amount,
        amount: `$${Number(claim.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        payoutAmount: Number(claim.amount || details.payoutDeducted || 0),
        status: claim.status.toLowerCase(),
        description: claim.reason,
        denialReason: details.denialReason || details.reasonForDenial || "",
        adjusterNotes: details.adjusterNotes || "",
        details,
        timeline: getClaimTimeline(claim),
      };
    });

    res.status(200).json({
      success: true,
      claims: formattedClaims,
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch claims",
    });
  }
};

// Helper function to generate timeline based on claim status
function getClaimTimeline(claim) {
  const baseTimeline = [
    {
      date: claim.date.toISOString().split("T")[0],
      status: "Claim submitted",
      details: "Initial claim filed",
      completed: true,
    },
  ];

  switch (claim.status.toLowerCase()) {
    case "pending":
      return baseTimeline;
    case "processing":
      return [
        ...baseTimeline,
        {
          date: new Date(claim.date).toISOString().split("T")[0],
          status: "Under review",
          details: "Claim assigned to adjuster",
          completed: true,
        },
      ];
    case "approved":
      return [
        ...baseTimeline,
        {
          date: new Date(claim.date).toISOString().split("T")[0],
          status: "Under review",
          details: "Claim assigned to adjuster",
          completed: true,
        },
        {
          date: new Date(claim.date).toISOString().split("T")[0],
          status: "Approved",
          details: "Claim approved for processing",
          completed: true,
        },
      ];
    case "paid":
      return [
        ...baseTimeline,
        {
          date: new Date(claim.date).toISOString().split("T")[0],
          status: "Under review",
          details: "Claim assigned to adjuster",
          completed: true,
        },
        {
          date: new Date(claim.date).toISOString().split("T")[0],
          status: "Approved",
          details: "Claim approved for processing",
          completed: true,
        },
        {
          date: new Date(claim.date).toISOString().split("T")[0],
          status: "Paid",
          details: "Payment processed",
          completed: true,
        },
      ];
    case "denied":
      return [
        ...baseTimeline,
        {
          date: new Date(claim.date).toISOString().split("T")[0],
          status: "Under review",
          details: "Claim assigned to adjuster",
          completed: true,
        },
        {
          date: new Date(claim.date).toISOString().split("T")[0],
          status: "Denied",
          details: claim.details?.denialReason || "Claim denied",
          completed: true,
        },
      ];
    default:
      return baseTimeline;
  }
}

// GET /api/claim/all (Admin only)
export const getAllClaimsForAdmin = async (req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      include: {
        vehicle: true,
        policy: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const formattedClaims = claims.map((claim) => ({
      id: claim.id,
      policyId: claim.policyId,
      policyName: claim.policy?.name || "Active Policy",
      coverageAmount: claim.policy?.coverageAmount || 0,
      customerId: claim.customerId,
      customerName: claim.customer
        ? `${claim.customer.firstName || ""} ${claim.customer.lastName || ""}`.trim()
        : "Valued Customer",
      customerEmail: claim.customer?.email || "",
      customerPhone: claim.customer?.profile?.phone || claim.details?.contactPhone || "N/A",
      vehicleId: claim.vehicleId,
      vehicleName: claim.vehicle
        ? `${claim.vehicle.year} ${claim.vehicle.brand} ${claim.vehicle.model}`
        : "Unknown Vehicle",
      vehicleVin: claim.vehicle?.vin || "N/A",
      claimType: claim.type,
      date: claim.date.toISOString().split("T")[0],
      amount: claim.amount || 0,
      status: claim.status.toLowerCase(),
      reason: claim.reason,
      details: claim.details || {},
      supportingDocument: claim.supportingDocument || "",
      createdAt: claim.createdAt,
    }));

    res.status(200).json({
      success: true,
      claims: formattedClaims,
    });
  } catch (error) {
    console.error("Error fetching all claims for admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch claims",
      error: error.message,
    });
  }
};

// PUT /api/claim/status/:id (Admin only)
export const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount, adjusterNotes, denialReason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = [
      "pending",
      "processing",
      "under_review",
      "approved",
      "paid",
      "denied",
      "rejected",
    ];
    const normalizedStatus = status.toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const existingClaim = await prisma.claim.findUnique({
      where: { id },
      include: {
        policy: true,
      },
    });

    if (!existingClaim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    const parsedAmount =
      amount !== undefined && amount !== "" ? parseFloat(amount) : existingClaim.amount;

    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Settlement amount must be a valid non-negative number",
      });
    }

    // 1. Calculate previous approved payout on this claim (if previously approved/paid)
    const wasAlreadyApproved =
      existingClaim.status.toLowerCase() === "approved" ||
      existingClaim.status.toLowerCase() === "paid";
    const previousPayout = wasAlreadyApproved ? Number(existingClaim.amount || 0) : 0;

    // 2. Current policy coverage in DB
    const currentPolicyCoverage = Number(existingClaim.policy?.coverageAmount || 0);

    // 3. Available coverage pool before this decision (restores previous payout if re-evaluating)
    const availablePool = currentPolicyCoverage + previousPayout;

    // 4. Is the new decision an approved payout?
    const isNewApproval =
      normalizedStatus === "approved" || normalizedStatus === "paid";
    const newPayout = isNewApproval ? parsedAmount : 0;

    // 5. Enforce available policy limit
    if (isNewApproval && availablePool > 0 && newPayout > availablePool) {
      return res.status(400).json({
        success: false,
        message: `Settlement payout of ${newPayout.toLocaleString()} exceeds the available policy coverage limit of ${availablePool.toLocaleString()}.`,
        availableCoverage: availablePool,
        attemptedAmount: newPayout,
      });
    }

    // 6. Subtract payout from policy coverage
    const updatedPolicyCoverage = Math.max(0, availablePool - newPayout);

    // 7. Update policy in DB to subtract approved payout
    if (existingClaim.policyId && (isNewApproval || wasAlreadyApproved)) {
      await prisma.policy.update({
        where: { id: existingClaim.policyId },
        data: {
          coverageAmount: updatedPolicyCoverage,
        },
      });
    }

    const existingDetails =
      typeof existingClaim.details === "object" && existingClaim.details !== null
        ? existingClaim.details
        : {};

    const updatedDetails = {
      ...existingDetails,
      adjusterNotes: adjusterNotes || existingDetails.adjusterNotes || "",
      denialReason: denialReason || existingDetails.denialReason || "",
      payoutDeducted: newPayout,
      remainingPolicyCoverage: updatedPolicyCoverage,
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user?.id || req.userId || "ADMIN",
    };

    // If denied, set payout to 0; otherwise use approved amount
    const finalAmount =
      normalizedStatus === "denied" || normalizedStatus === "rejected"
        ? 0
        : newPayout;

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: {
        status: normalizedStatus === "rejected" ? "denied" : normalizedStatus,
        amount: finalAmount,
        adminId: req.user?.id || req.userId || undefined,
        details: updatedDetails,
      },
      include: {
        vehicle: true,
        policy: true,
        customer: true,
      },
    });

    // Notify customer about claim adjudication decision
    try {
      if (existingClaim.customerId) {
        await createNotificationHelper({
          customerId: existingClaim.customerId,
          title: `Claim ${normalizedStatus === "approved" ? "Approved" : normalizedStatus === "rejected" || normalizedStatus === "denied" ? "Rejected" : "Updated"}`,
          message: `Your claim (${existingClaim.id}) was reviewed. Status: ${normalizedStatus.toUpperCase()}. Settlement amount: $${finalAmount.toLocaleString()}${denialReason ? ` (Reason: ${denialReason})` : ""}`,
          type: "claim",
        });
      }
    } catch (notifErr) {
      console.error("Failed to notify customer:", notifErr);
    }

    res.status(200).json({
      success: true,
      message: `Claim status updated to ${normalizedStatus}`,
      claim: updatedClaim,
    });
  } catch (error) {
    console.error("Error updating claim status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update claim status",
      error: error.message,
    });
  }
};

// Download official settlement letter for approved claim
export const downloadSettlementDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.userId || req.query.userId;

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        policy: true,
      },
    });

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    const isAuthorized =
      !userId ||
      claim.customerId === userId ||
      claim.vehicle?.customerId === userId ||
      req.user?.role === "ADMIN";

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download this settlement letter",
      });
    }

    const pdfBuffer = await generateSettlementPDF(
      claim,
      claim.customer,
      claim.vehicle,
      claim.policy
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Settlement_Notice_${claim.id}.pdf"`
    );
    res.setHeader("Content-Transfer-Encoding", "binary");

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Settlement PDF download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate settlement document",
      error: error.message,
    });
  }
};
