// import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { generateProfileId, generateUserId } from "../utils/idGenerator.js";
// const prisma = new PrismaClient();
export const updateProfile = async (req, res) => {
  const userId = req.user?.id || req.userId || req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User session expired or not authenticated. Please log in again.",
    });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    phone2,
    address,
    city,
    subCity,
    country,
    age,
    gender,
    occupation,
    dateOfBirth,
    avatar,
    bio,
    emergencyContactName,
    emergencyContactPhone,
  } = req.body;

  try {
    const parsedAge = age !== undefined && age !== "" && !isNaN(parseInt(age, 10)) ? parseInt(age, 10) : undefined;
    
    let parsedDob = undefined;
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
      }
    }

    // Always store emergency contact details into bio if emergency contacts are provided
    let combinedBio = bio;
    if (emergencyContactName || emergencyContactPhone) {
      combinedBio = JSON.stringify({
        emergencyContactName: emergencyContactName || "",
        emergencyContactPhone: emergencyContactPhone || "",
      });
    }

    const profileData = {
      phone: phone !== undefined ? String(phone).trim() : undefined,
      phone2: phone2 !== undefined ? String(phone2).trim() : undefined,
      address: address !== undefined ? address : undefined,
      city: city !== undefined ? city : undefined,
      subCity: subCity !== undefined ? subCity : undefined,
      country: country || "Ethiopia",
      age: parsedAge,
      gender: gender || undefined,
      occupation: occupation || undefined,
      dateOfBirth: parsedDob,
      avator: avatar || undefined,
      bio: combinedBio || undefined,
    };

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        id: generateProfileId(),
        userId,
        ...profileData,
      },
    });

    // Update user-specific fields in the User model safely
    const userData = {};
    if (firstName && firstName.trim()) userData.firstName = firstName.trim();
    if (lastName && lastName.trim()) userData.lastName = lastName.trim();

    if (email && typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (currentUser && currentUser.email !== normalizedEmail) {
        const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingEmail && existingEmail.id !== userId) {
          return res.status(400).json({
            success: false,
            message: "This email address is already registered to another account.",
          });
        }
        userData.email = normalizedEmail;
      }
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    // Attach parsed emergency contacts for direct frontend access
    const responseProfile = { ...profile };
    if (profile.bio) {
      try {
        const parsed = JSON.parse(profile.bio);
        if (parsed && typeof parsed === "object") {
          responseProfile.emergencyContactName = parsed.emergencyContactName || "";
          responseProfile.emergencyContactPhone = parsed.emergencyContactPhone || "";
        }
      } catch {}
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: responseProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating profile",
      error: error.message,
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId || req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Extract emergency contacts from bio JSON if present
    if (userProfile.profile && userProfile.profile.bio) {
      try {
        const parsed = JSON.parse(userProfile.profile.bio);
        if (parsed && typeof parsed === "object") {
          userProfile.profile.emergencyContactName = parsed.emergencyContactName || "";
          userProfile.profile.emergencyContactPhone = parsed.emergencyContactPhone || "";
        }
      } catch {}
    }

    res.status(200).json({
      success: true,
      userProfile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching profile",
    });
  }
};
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" },
        NOT: [{ email: "admin@velosure.com" }, { email: "admin@vims.com" }],
      },
      include: {
        profile: true,
        vehicles: true,
        policies: true,
        claimsAsCustomer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend (e.g., controllers/userController.ts)
// controllers/userController.ts

export const getUserDashboardData = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        firstName: true,
        lastName: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastLogin: new Date() },
    });

    return res.status(200).json({
      success: true,
      userName: `${user.firstName} ${user.lastName}`,
      lastLogin: user.lastLogin?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Error in getUserDashboardData:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    // Get user ID from query params (passed from frontend)
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

    res.json({
      success: true,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      joinDate: admin.createdAt,
      profile: admin.profile || {
        phone: null,
        qualification: null,
        status: null,
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin profile",
      error: error.message,
    });
  }
};
const profileId = generateProfileId();
export const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { firstName, lastName, phone, qualification, status } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName },
    });

    // Update or create profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: { phone, qualification, status },
      create: {
        id: profileId,
        userId,
        phone,
        qualification,
        status,
      },
    });

    res.json({
      success: true,
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
      },
      profile: {
        phone: updatedProfile.phone,
        qualification: updatedProfile.qualification,
        status: updatedProfile.status,
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Get all users

// Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        policies: true,
        claimsAsCustomer: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      status: user.profile?.status || "Active",
      activePolicies: user.policies?.length || 0,
      recentClaim:
        user.claimsAsCustomer[0]?.createdAt?.toISOString().split("T")[0] ||
        null,
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, status } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        id: generateUserId(),
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "CUSTOMER",
        profile: {
          create: {
            status: status || "Active",
          },
        },
      },
      include: {
        profile: true,
        policies: true,
      },
    });

    res.json({
      success: true,
      data: {
        id: newUser.id,
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        status: newUser.profile?.status || "Active",
        activePolicies: newUser.policies?.length || 0,
        recentClaim: null,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message:
        error.code === "P2002"
          ? "Email already exists"
          : "Failed to create user",
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, status } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        profile: {
          update: {
            status,
          },
        },
      },
      include: {
        profile: true,
        policies: true,
        claimsAsCustomer: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        email: updatedUser.email,
        status: updatedUser.profile?.status || "Active",
        activePolicies: updatedUser.policies?.length || 0,
        recentClaim:
          updatedUser.claimsAsCustomer[0]?.createdAt
            ?.toISOString()
            .split("T")[0] || null,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message:
        error.code === "P2002"
          ? "Email already exists"
          : "Failed to update user",
    });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await prisma.profile.update({
      where: { userId: id },
      data: { status },
    });

    res.json({
      success: true,
      message: "User status updated successfully",
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};
