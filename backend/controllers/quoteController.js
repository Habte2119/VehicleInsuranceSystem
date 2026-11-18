// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// export const calculateQuote = async (req, res) => {
//   try {
//     const {
//       fullName,
//       age,
//       email,
//       phone,
//       address,
//       driversLicenseNumber,
//       vehicleType,
//       vehicleMake,
//       vehicleModel,
//       vehicleYear,
//       vehicleVin,
//       ownershipType,
//       vehicleUsage,
//       primaryParkingLocation,
//       annualMileage,
//       odometerReading,
//       estimatedValue,
//       hasAntiTheftDevices,
//       collisionCoverage,
//       comprehensiveCoverage,
//       liabilityCoverage,
//       roadsideAssistance,
//       rentalReimbursement,
//       deductibleAmount,
//       coverageDuration,
//       startDate,
//       additionalDrivers,
//       coverageLevel,
//     } = req.body;

//     // Calculation logic remains the same...
//     const basePrice =
//       vehicleType === "luxury"
//         ? 200
//         : vehicleType === "suv"
//           ? 150
//           : vehicleType === "truck"
//             ? 170
//             : vehicleType === "motorcycle"
//               ? 100
//               : 120;

//     const ageMultiplier = age < 25 ? 1.5 : age > 65 ? 1.2 : 1;
//     const usageMultiplier = vehicleUsage === "commercial" ? 1.4 : 1;
//     const coverageMultiplier =
//       deductibleAmount === 250 ? 1.5 : deductibleAmount === 500 ? 1.2 : 1;

//     const discounts = [];
//     if (age > 30) discounts.push("Safe Driver");
//     if (vehicleYear > 2020) discounts.push("New Vehicle");
//     if (hasAntiTheftDevices) discounts.push("Anti-Theft Devices");

//     const monthlyPremium = parseFloat(
//       (
//         basePrice *
//         ageMultiplier *
//         usageMultiplier *
//         coverageMultiplier
//       ).toFixed(2)
//     );

//     const quote = await prisma.quote.create({
//       data: {
//         fullName,
//         age,
//         email,
//         phone,
//         address,
//         driversLicenseNumber: driversLicenseNumber || null,
//         vehicleType,
//         vehicleMake,
//         vehicleModel,
//         vehicleYear,
//         vehicleVin: vehicleVin || null,
//         ownershipType: ownershipType || null,
//         vehicleUsage,
//         primaryParkingLocation: primaryParkingLocation || null,
//         annualMileage: annualMileage || null,
//         odometerReading: odometerReading || null,
//         estimatedValue: estimatedValue || null,
//         hasAntiTheftDevices: hasAntiTheftDevices || false,
//         collisionCoverage: collisionCoverage || false,
//         comprehensiveCoverage: comprehensiveCoverage || false,
//         liabilityCoverage: liabilityCoverage || true,
//         roadsideAssistance: roadsideAssistance || false,
//         rentalReimbursement: rentalReimbursement || false,
//         deductibleAmount: parseInt(deductibleAmount, 10),
//         coverageDuration: parseInt(coverageDuration, 10),
//         startDate: startDate ? new Date(startDate) : new Date(),
//         coverageLevel: coverageLevel || null,
//         monthlyPremium,
//         estimatedSavings: parseFloat((Math.random() * 300 + 100).toFixed(2)),
//         discounts: JSON.stringify(discounts),
//         additionalDrivers: {
//           create: additionalDrivers?.map((driver) => ({
//             name: driver.name,
//             age: driver.age,
//             drivingHistory: driver.drivingHistory,
//           })),
//         },
//       },
//     });

//     res.status(200).json({
//       success: true,
//       data: {
//         ...quote,
//         discounts: quote.discounts, // Return as-is (will be parsed in frontend)
//       },
//     });
//   } catch (error) {
//     console.error("Error calculating quote:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to calculate quote" });
//   }
// };

// export const saveTemporaryQuote = async (req, res) => {
//   try {
//     const { quoteData } = req.body;

//     if (!quoteData) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Quote data is required" });
//     }

//     const quoteId = quoteData.id || Math.random().toString(36).substring(2, 15);

//     await prisma.temporaryQuote.upsert({
//       where: { quoteId },
//       update: {
//         quoteData: JSON.stringify(quoteData),
//       },
//       create: {
//         quoteId,
//         quoteData: JSON.stringify(quoteData),
//       },
//     });

//     res.status(201).json({ success: true, quoteId });
//   } catch (error) {
//     console.error("Error saving temporary quote:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// export const getTemporaryQuoteById = async (req, res) => {
//   try {
//     const { quoteId } = req.params;

//     if (!quoteId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Quote ID is required" });
//     }

//     // First check regular quotes
//     const quote = await prisma.quote.findUnique({
//       where: { id: quoteId },
//     });

//     if (quote) {
//       return res.status(200).json({
//         success: true,
//         data: {
//           ...quote,
//           discounts:
//             typeof quote.discounts === "string"
//               ? JSON.parse(quote.discounts)
//               : quote.discounts,
//         },
//       });
//     }

//     // If not found in regular quotes, check temporary quotes
//     const temporaryQuote = await prisma.temporaryQuote.findUnique({
//       where: { quoteId },
//     });

//     if (!temporaryQuote) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Quote not found" });
//     }

//     const parsedQuoteData = JSON.parse(temporaryQuote.quoteData);
//     res.status(200).json({ success: true, data: parsedQuoteData });
//   } catch (error) {
//     console.error("Error fetching quote by ID:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// // Add this to associate quotes with users after login
// export const associateQuoteWithUser = async (userId, quoteId) => {
//   const temporaryQuote = await prisma.temporaryQuote.findUnique({
//     where: { quoteId },
//   });

//   if (temporaryQuote) {
//     const quoteData = JSON.parse(temporaryQuote.quoteData);
//     await prisma.quote.create({
//       data: {
//         ...quoteData,
//         userId,
//         isTemporary: false,
//       },
//     });
//     await prisma.temporaryQuote.delete({
//       where: { quoteId },
//     });
//   }
// };

// import { PrismaClient } from "@prisma/client";
import { generateQuoteId, generateDriverId } from "../utils/idGenerator.js"; // Import custom ID generator
import { prisma } from "../config/db.js";
// const prisma = new PrismaClient();

export const calculateQuote = async (req, res) => {
  try {
    const {
      fullName,
      age,
      email,
      phone,
      address,
      driversLicenseNumber,
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleVin,
      ownershipType,
      vehicleUsage,
      primaryParkingLocation,
      annualMileage,
      odometerReading,
      estimatedValue,
      hasAntiTheftDevices,
      collisionCoverage,
      comprehensiveCoverage,
      liabilityCoverage,
      roadsideAssistance,
      rentalReimbursement,
      deductibleAmount,
      coverageDuration,
      startDate,
      additionalDrivers,
      coverageLevel,
    } = req.body;

    // 0. Resolve vehicle specifications: if registered vehicleId is passed, lock to DB record
    let effectiveMake = vehicleMake || "Unknown Make";
    let effectiveModel = vehicleModel || "Unknown Model";
    let effectiveYear = parseInt(vehicleYear, 10) || new Date().getFullYear();
    let effectiveVin = vehicleVin || null;
    let effectiveType = (vehicleType || "sedan").toLowerCase();
    let effectiveValue = parseFloat(estimatedValue) || 0;

    let validVehicleId = null;
    const candidateVehicleId = req.body.vehicleId;
    if (candidateVehicleId && typeof candidateVehicleId === "string" && candidateVehicleId.trim()) {
      try {
        const regVeh = await prisma.vehicle.findUnique({
          where: { id: candidateVehicleId.trim() },
        });
        if (regVeh) {
          validVehicleId = regVeh.id;
          effectiveMake = regVeh.brand || effectiveMake;
          effectiveModel = regVeh.model || effectiveModel;
          effectiveYear = parseInt(regVeh.year, 10) || effectiveYear;
          effectiveVin = regVeh.vin || effectiveVin;
          effectiveType = (regVeh.vehicleType || effectiveType).toLowerCase();
          effectiveValue = parseFloat(regVeh.marketValue) || effectiveValue;
        }
      } catch (e) {
        console.warn("[quoteController] Vehicle lookup error:", e.message);
      }
    }

    // 0.1 Validate candidate userId if passed to avoid foreign key violation
    let validUserId = null;
    const candidateUserId = req.body.userId || req.user?.id || req.userId;
    if (candidateUserId && typeof candidateUserId === "string" && candidateUserId.trim()) {
      try {
        const foundUser = await prisma.user.findUnique({
          where: { id: candidateUserId.trim() },
          select: { id: true },
        });
        if (foundUser) {
          validUserId = foundUser.id;
        }
      } catch (e) {
        console.warn("[quoteController] User lookup error:", e.message);
      }
    }

    // 1. Base price by vehicle type
    const vType = effectiveType;
    const basePrice =
      vType === "luxury"
        ? 200
        : vType === "suv"
          ? 150
          : vType === "truck"
            ? 170
            : vType === "motorcycle"
              ? 85
              : 110; // sedan/standard

    // 2. Coverage Level Multiplier (Basic vs Standard vs Comprehensive / Premium)
    // Basic = 0.75x (-25% Liability focus)
    // Standard = 1.00x (Baseline)
    // Comprehensive = 1.50x (+50% Full Protection)
    const rawTier = (coverageLevel || "Standard").toLowerCase();
    const normalizedTier =
      rawTier === "basic"
        ? "Basic"
        : (rawTier === "comprehensive" || rawTier === "premium")
          ? "Comprehensive"
          : "Standard";

    const coverageLevelMultiplier =
      normalizedTier === "Basic"
        ? 0.75
        : normalizedTier === "Comprehensive"
          ? 1.50
          : 1.0;

    // 3. Add-on features adjustments
    let addOnsMonthly = 0;
    if (collisionCoverage && normalizedTier === "Basic") addOnsMonthly += 18;
    if (comprehensiveCoverage && normalizedTier !== "Comprehensive") addOnsMonthly += 24;
    if (roadsideAssistance && normalizedTier === "Basic") addOnsMonthly += 8;
    if (rentalReimbursement) addOnsMonthly += 7;

    // 4. Driver Age and Usage multipliers
    const parsedAge = parseInt(age, 10) || 30;
    const ageMultiplier = parsedAge < 25 ? 1.45 : parsedAge > 65 ? 1.2 : 1.0;
    const usageMultiplier = vehicleUsage === "commercial" ? 1.35 : vehicleUsage === "commute" ? 1.08 : 1.0;

    // 5. Deductible Multiplier
    const parsedDeductible = parseInt(deductibleAmount, 10) || 500;
    const coverageMultiplier =
      parsedDeductible === 250 ? 1.35 : parsedDeductible === 1000 ? 0.85 : 1.0;

    // 6. Vehicle Value adjustment (higher value = higher replacement risk)
    const parsedValue = effectiveValue;
    const valueMultiplier = parsedValue > 50000 ? 1.25 : parsedValue > 30000 ? 1.12 : 1.0;

    // 7. Calculate real mathematical discounts
    const parsedYear = effectiveYear;
    const parsedDuration = parseInt(coverageDuration, 10) || 12;

    const discounts = [];
    let totalDiscountPercent = 0;

    if (parsedAge >= 30) {
      discounts.push("Safe Driver (10%)");
      totalDiscountPercent += 0.10;
    }
    if (parsedYear >= 2021) {
      discounts.push("New Vehicle (8%)");
      totalDiscountPercent += 0.08;
    }
    if (hasAntiTheftDevices) {
      discounts.push("Anti-Theft Device (7%)");
      totalDiscountPercent += 0.07;
    }
    if (parsedDuration === 12) {
      discounts.push("Annual Term Discount (10%)");
      totalDiscountPercent += 0.10;
    }

    // Cap total discount at 35% max
    const appliedDiscountRate = Math.min(totalDiscountPercent, 0.35);

    // Standard un-discounted monthly & annual rates
    const rawMonthly =
      (basePrice * coverageLevelMultiplier * ageMultiplier * usageMultiplier * coverageMultiplier * valueMultiplier) +
      addOnsMonthly;
    const standardAnnualRate = rawMonthly * 12;

    // Real calculated savings
    const rawSavings = standardAnnualRate * appliedDiscountRate;
    const estimatedSavings = isNaN(rawSavings) ? 0.0 : parseFloat(rawSavings.toFixed(2));
    const finalAnnualRate = standardAnnualRate - estimatedSavings;
    const rawMonthlyFinal = finalAnnualRate / 12;
    const monthlyPremium = (isNaN(rawMonthlyFinal) || rawMonthlyFinal <= 0) ? 89.0 : parseFloat(rawMonthlyFinal.toFixed(2));

    // Date safety
    let safeStartDate = new Date();
    if (startDate) {
      const parsedD = new Date(startDate);
      if (!isNaN(parsedD.getTime())) {
        safeStartDate = parsedD;
      }
    }

    // Year safety (must be integer)
    const safeYear = (effectiveYear && !isNaN(effectiveYear) && effectiveYear >= 1900 && effectiveYear <= new Date().getFullYear() + 2)
      ? parseInt(effectiveYear, 10)
      : new Date().getFullYear();

    // Unique quote ID
    const baseQuoteId = generateQuoteId();
    const quoteId = `${baseQuoteId}-${Date.now().toString(36).slice(-4)}`;

    const quote = await prisma.quote.create({
      data: {
        id: quoteId,
        userId: validUserId,
        vehicleId: validVehicleId,
        fullName: String(fullName || "Valued Customer").trim() || "Valued Customer",
        age: parsedAge,
        email: String(email || "customer@example.com").trim().toLowerCase() || "customer@example.com",
        phone: String(phone || "").trim(),
        address: String(address || "").trim(),
        driversLicenseNumber: driversLicenseNumber || null,
        vehicleType: vType || "sedan",
        vehicleMake: String(effectiveMake || "Standard").trim(),
        vehicleModel: String(effectiveModel || "Vehicle").trim(),
        vehicleYear: safeYear,
        vehicleVin: effectiveVin || null,
        ownershipType: ownershipType || null,
        vehicleUsage: vehicleUsage || "personal",
        primaryParkingLocation: primaryParkingLocation || null,
        annualMileage: annualMileage && !isNaN(parseInt(annualMileage, 10)) ? parseInt(annualMileage, 10) : null,
        odometerReading: odometerReading && !isNaN(parseFloat(odometerReading)) ? parseFloat(odometerReading) : null,
        estimatedValue: parsedValue > 0 && !isNaN(parsedValue) ? parsedValue : null,
        hasAntiTheftDevices: Boolean(hasAntiTheftDevices),
        collisionCoverage: Boolean(collisionCoverage),
        comprehensiveCoverage: Boolean(comprehensiveCoverage),
        liabilityCoverage: Boolean(liabilityCoverage),
        roadsideAssistance: Boolean(roadsideAssistance),
        rentalReimbursement: Boolean(rentalReimbursement),
        deductibleAmount: parsedDeductible,
        coverageDuration: parsedDuration,
        startDate: safeStartDate,
        coverageLevel: normalizedTier,
        monthlyPremium,
        estimatedSavings,
        discounts: discounts || [],
        additionalDrivers:
          additionalDrivers && additionalDrivers.length > 0
            ? {
                create: additionalDrivers.map((driver) => ({
                  id: generateDriverId(),
                  name: driver.name,
                  age: parseInt(driver.age, 10) || 25,
                  drivingHistory: driver.drivingHistory || "Clean",
                })),
              }
            : undefined,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...quote,
        discounts: quote.discounts,
      },
    });
  } catch (error) {
    console.error("Error calculating quote:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Failed to calculate quote" });
  }
};

export const saveTemporaryQuote = async (req, res) => {
  try {
    const { quoteData } = req.body;

    if (!quoteData) {
      return res
        .status(400)
        .json({ success: false, message: "Quote data is required" });
    }

    // Generate custom quote ID
    const quoteId = generateQuoteId();

    await prisma.temporaryQuote.upsert({
      where: { quoteId },
      update: {
        quoteData: JSON.stringify(quoteData),
      },
      create: {
        quoteId,
        quoteData: JSON.stringify(quoteData),
      },
    });

    res.status(201).json({ success: true, quoteId });
  } catch (error) {
    console.error("Error saving temporary quote:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getTemporaryQuoteById = async (req, res) => {
  try {
    const { quoteId } = req.params;

    if (!quoteId) {
      return res
        .status(400)
        .json({ success: false, message: "Quote ID is required" });
    }

    // First check regular quotes
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (quote) {
      return res.status(200).json({
        success: true,
        data: {
          ...quote,
          discounts:
            typeof quote.discounts === "string"
              ? JSON.parse(quote.discounts)
              : quote.discounts,
        },
      });
    }

    // If not found in regular quotes, check temporary quotes
    const temporaryQuote = await prisma.temporaryQuote.findUnique({
      where: { quoteId },
    });

    if (!temporaryQuote) {
      return res
        .status(404)
        .json({ success: false, message: "Quote not found" });
    }

    const parsedQuoteData = JSON.parse(temporaryQuote.quoteData);
    res.status(200).json({ success: true, data: parsedQuoteData });
  } catch (error) {
    console.error("Error fetching quote by ID:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Add this to associate quotes with users after login
export const associateQuoteWithUser = async (userId, quoteId) => {
  const temporaryQuote = await prisma.temporaryQuote.findUnique({
    where: { quoteId },
  });

  if (temporaryQuote) {
    const quoteData = JSON.parse(temporaryQuote.quoteData);
    await prisma.quote.create({
      data: {
        id: generateQuoteId(), // Generate a new custom ID when associating
        ...quoteData,
        userId,
        isTemporary: false,
      },
    });
    await prisma.temporaryQuote.delete({
      where: { quoteId },
    });
  }
};
