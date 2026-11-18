import express from "express";
import { verifyToken } from "../midleware/verifyToken.js";
import {
  getAnalyticsSummary,
  getReportsList,
  generateReport,
  downloadReportPDF,
  downloadCustomerStatementPDF,
  deleteReport,
} from "../controllers/reportController.js";

const router = express.Router();

// Public / auth-tolerant analytics summary for dashboards
router.get("/analytics", getAnalyticsSummary);

// Reports history list
router.get("/list", getReportsList);

// Customer Statement & Official Certificate PDF Download
router.get("/customer-statement", (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) || req.cookies?.token;
  if (token) return verifyToken(req, res, next);
  next();
}, downloadCustomerStatementPDF);

router.get("/statement", (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) || req.cookies?.token;
  if (token) return verifyToken(req, res, next);
  next();
}, downloadCustomerStatementPDF);

// Download specific report PDF
router.get("/download/:id", downloadReportPDF);

// Generate report (admin or session)
router.post("/generate", (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) || req.cookies?.token;
  if (token) return verifyToken(req, res, next);
  next();
}, generateReport);

// Delete report
router.delete("/:id", (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) || req.cookies?.token;
  if (token) return verifyToken(req, res, next);
  next();
}, deleteReport);

export default router;
