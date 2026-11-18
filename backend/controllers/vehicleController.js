// import { PrismaClient } from "@prisma/client";
import { prisma } from "../config/db.js";
import { generateVehicleId } from "../utils/idGenerator.js";
// const prisma = new PrismaClient();

export const addVehicle = async (req, res) => {
  const {
    name,
    brand,
    model,
    vin,
    fuelType,
    vehicleType,
    odometerReading,
    purchaseDate,
    marketValue,
    isCommercial,
    color,
    year,
    status,
  } = req.body;

  const userId = req.userId || req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User authentication required",
    });
  }

  if (!brand || !model || !year) {
    return res.status(400).json({
      success: false,
      message: "Vehicle make (brand), model, and year are required",
    });
  }

  if (!color || !String(color).trim()) {
    return res.status(400).json({
      success: false,
      message: "Vehicle color is required",
    });
  }

  const parsedMarketValue = parseFloat(marketValue);
  if (isNaN(parsedMarketValue) || parsedMarketValue <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid vehicle market value greater than 0 is required",
    });
  }

  const parsedOdo = parseInt(odometerReading, 10);
  if (isNaN(parsedOdo) || parsedOdo < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid vehicle odometer reading is required",
    });
  }

  try {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { vin },
    });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with this VIN already exists",
      });
    }

    const newvehicle = await prisma.vehicle.create({
      data: {
        id: generateVehicleId(),
        name: name || `${brand} ${model}`,
        brand,
        model,
        vin,
        fuelType: fuelType || "Petrol",
        vehicleType: vehicleType || "Sedan",
        color: color || "Unknown",
        odometerReading: parseInt(odometerReading) || 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        marketValue: parseFloat(marketValue) || 0,
        isCommercial: Boolean(isCommercial),
        year: parseInt(year) || new Date().getFullYear(),
        status: status || "Active",
        customer: { connect: { id: userId } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: newvehicle,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyVehicle = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { customerId: userId },
      include: {
        policies: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: {
        purchaseDate: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      vehicles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    brand,
    model,
    vin,
    fuelType,
    vehicleType,
    odometerReading,
    purchaseDate,
    marketValue,
    isCommercial,
    color,
    year,
    status,
  } = req.body;
  try {
    const exisitingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });
    if (!exisitingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle not found in the database",
      });
    }
    const updateVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        name,
        brand,
        model,
        vin,
        fuelType,
        vehicleType,
        odometerReading: parseInt(odometerReading),
        purchaseDate: new Date(purchaseDate),
        marketValue: parseInt(marketValue),
        isCommercial,
        color,
        year,
        status,
      },
    });
    res.status(200).json({
      success: true,
      message: "vehicle updated succesfully",
      vehicle: updateVehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) {
      return res.status(400).json({
        success: false,
        message: "vehicle not found",
      });
    }
    await prisma.vehicle.delete({
      where: { id },
    });
    res.status(200).json({
      success: true,
      message: "vehicle deleted succesfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getVehicleDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        policies: true,
        claims: true,
      },
    });
    if (!vehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle not found",
      });
    }
    res.status(200).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getVehicleWithoutPolicy = async (req, res) => {
  try {
    const currentDate = new Date();
    const uninsuredVehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { policies: null },
          {
            policies: {
              endDate: {
                lt: currentDate,
              },
            },
          },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        policies: true,
      },
    });
    res.status(200).json({
      success: true,
      vehicles: uninsuredVehicles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// routes/vehicles.js

export const fetchUserVehicle = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { customerId: userId },
      select: {
        id: true,
        name: true,
        vin: true,
        brand: true,
        model: true,
        year: true,
        color: true,
        marketValue: true,
        isCommercial: true,
        vehicleType: true,
        purchaseDate: true,
        odometerReading: true,
        status: true,
      },
    });

    if (!vehicles || vehicles.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No vehicles found" });
    }

    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    console.error("Error fetching user vehicles:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch vehicles" });
  }
};
