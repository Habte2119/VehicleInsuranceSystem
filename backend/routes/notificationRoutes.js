import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

/**
 * Authentication helper that resolves user from JWT token (cookie or header)
 * or falls back to query/body userId.
 */
const resolveAuthUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = bearerToken || req.cookies?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const targetUserId = decoded.userId || decoded.id || decoded.sub;
        if (targetUserId) {
          req.userId = targetUserId;
          const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, role: true, isVerified: true, email: true },
          });
          if (user) req.user = user;
        }
      } catch (err) {
        // Token might be expired; fallback to query/body
      }
    }

    if (!req.userId) {
      req.userId = req.query.userId || req.body?.userId;
    }

    next();
  } catch (err) {
    next();
  }
};

// Apply auth resolver to all notification routes
router.use(resolveAuthUser);

// List notifications (for current user or admin)
router.get("/", getUserNotifications);

// Count unread notifications
router.get("/count", getUnreadNotificationCount);

// Mark single notification as read
router.put("/:id/read", markNotificationAsRead);

// Mark all as read
router.put("/mark-as-read", markAllNotificationsAsRead);

// Delete notification
router.delete("/:id", deleteNotification);

export default router;
