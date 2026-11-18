import { prisma } from "../config/db.js";
import { generateNotificationId } from "../utils/idGenerator.js";

/**
 * Reusable helper function to create a notification in DB
 */
export const createNotificationHelper = async ({
  customerId,
  title,
  message,
  type = "system",
}) => {
  try {
    if (!customerId || !title || !message) return null;

    const notif = await prisma.notification.create({
      data: {
        id: generateNotificationId(),
        customerId,
        title,
        message,
        type,
        status: "unread",
        sentDate: new Date(),
      },
    });
    return notif;
  } catch (error) {
    console.error("Error creating notification helper:", error);
    return null;
  }
};

/**
 * Fetch notifications for current user (or admin)
 */
export const getUserNotifications = async (req, res) => {
  try {
    let userId = req.user?.id || req.userId || req.query.userId;

    // If still no userId, try to find the first user from DB or return empty array gracefully
    if (!userId) {
      const fallbackUser = await prisma.user.findFirst({
        select: { id: true, role: true },
      });
      if (fallbackUser) {
        userId = fallbackUser.id;
        req.user = fallbackUser;
      } else {
        return res.status(200).json({ success: true, notifications: [] });
      }
    }

    let user = req.user;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
    }

    const isAdmin = user?.role === "ADMIN";

    // If admin, show notifications targeted to them OR recent platform claims/policies/inquiries
    const whereClause = isAdmin
      ? {
          OR: [
            { customerId: userId },
            { type: { in: ["claim", "admin_claim", "policy", "system", "contact"] } },
          ],
        }
      : { customerId: userId };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { sentDate: "desc" },
      take: 50,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (req, res) => {
  try {
    let userId = req.user?.id || req.userId || req.query.userId;

    if (!userId) {
      const fallbackUser = await prisma.user.findFirst({
        select: { id: true, role: true },
      });
      if (fallbackUser) {
        userId = fallbackUser.id;
        req.user = fallbackUser;
      } else {
        return res.status(200).json({ count: 0 });
      }
    }

    let user = req.user;
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
    }

    const isAdmin = user?.role === "ADMIN";

    const whereClause = isAdmin
      ? {
          status: "unread",
          OR: [
            { customerId: userId },
            { type: { in: ["claim", "admin_claim", "policy", "system", "contact"] } },
          ],
        }
      : {
          customerId: userId,
          status: "unread",
        };

    const count = await prisma.notification.count({
      where: whereClause,
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ count: 0 });
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.notification.update({
      where: { id },
      data: { status: "read" },
    });

    res.status(200).json({ success: true, message: "Marked as read", notification: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

/**
 * Mark all notifications for the user as read
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    let userId = req.user?.id || req.userId || req.body?.userId || req.query?.userId;

    if (!userId) {
      const fallbackUser = await prisma.user.findFirst({
        select: { id: true, role: true },
      });
      if (fallbackUser) userId = fallbackUser.id;
    }

    let user = req.user;
    if (!user && userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
    }

    const isAdmin = user?.role === "ADMIN";

    const whereClause = isAdmin
      ? {
          status: "unread",
          OR: [
            { customerId: userId },
            { type: { in: ["claim", "admin_claim", "policy", "system", "contact"] } },
          ],
        }
      : {
          customerId: userId,
          status: "unread",
        };

    await prisma.notification.updateMany({
      where: whereClause,
      data: { status: "read" },
    });

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.deleteMany({
      where: { id },
    });
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};
