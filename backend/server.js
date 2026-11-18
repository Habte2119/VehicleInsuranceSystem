import express from "express";
import path from "path";
import { testDb } from "./config/db.js";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
// import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import satusRoutes from "./routes/statusRoutes.js";
import claimRoutes from "./routes/claimRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import profileRoute from "./routes/profileRoute.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import "dotenv/config";
// dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//middelwares
app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true, // 🔐 this is required for cookies to be sent
  })
);
//helmet is a security middleware that helps you protect your app by setting various Http headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
//log the request
app.use(morgan("dev"));
//serve uploaded files and documents statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/policy-documents", express.static(path.join(process.cwd(), "public", "policy-documents")));
app.use(express.static(path.join(process.cwd(), "public")));
//endpoints
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/policy", policyRoutes);
app.use("/api/quote", quoteRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/status", satusRoutes);
app.use("/api/claim", claimRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/profile", profileRoute);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/contact", contactRoutes);

// In production, serve the built React frontend
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "frontend", "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (
      !req.path.startsWith("/api") &&
      !req.path.startsWith("/uploads") &&
      !req.path.startsWith("/policy-documents")
    ) {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });
}

app.listen(PORT, () => {
  testDb();
  console.log("server running on port " + PORT);
});
