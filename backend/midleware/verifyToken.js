import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const token = bearerToken || req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const targetUserId = decoded.userId || decoded.id || decoded.sub;
    if (!targetUserId) {
      return res.status(401).json({
        success: false,
        message: "Invalid session token. Please log in again.",
      });
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        isVerified: true,
      },
    });

    // Check account status
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found",
      });
    }

    // if (!user.isActive) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Account deactivated",
    //   });
    // }

    // if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Account temporarily locked",
    //   });
    // }

    // Attach user to request
    req.userId = user.id;
    req.user = {
      id: user.id,
      userId: user.id,
      role: user.role,
      isVerified: user.isVerified,
      email: decoded.email,
    };

    next();
  } catch (error) {
    let message = "Authentication failed";
    let status = 401;

    if (error instanceof jwt.TokenExpiredError) {
      message = "Session expired - Please login again";
    } else if (error instanceof jwt.JsonWebTokenError) {
      message = "Invalid token - Please login again";
    } else {
      console.error("Auth Error:", error);
      status = 500;
      message = error.message || "Internal server error";
    }

    return res.status(status).json({ success: false, message });
  }
};
