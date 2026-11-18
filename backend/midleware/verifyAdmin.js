import { prisma } from "../config/db.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    let role = req.role || req.user?.role;

    // Fail-safe: if role is missing but userId is present, look up the fresh role directly from DB
    if (!role && (req.userId || req.user?.id)) {
      const u = await prisma.user.findUnique({
        where: { id: req.userId || req.user.id },
        select: { role: true },
      });
      role = u?.role;
    }

    const normalizedRole = (role || "").toUpperCase();
    if (normalizedRole !== "ADMIN") {
      console.warn(
        `[verifyAdmin] Access denied for user: ${req.user?.email || req.userId || "anonymous"} (Role in DB: "${role}")`
      );
      return res.status(403).json({
        success: false,
        message: "Access denied. Administrator privileges required.",
        currentRole: role || "UNAUTHORIZED",
      });
    }

    next();
  } catch (error) {
    console.error("[verifyAdmin] Error during admin authorization check:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization check error",
    });
  }
};
