import express from "express";
import {
  submitContactInquiry,
  getContactInquiries,
  updateInquiryStatus,
} from "../controllers/contactController.js";

const router = express.Router();

// Public: Submit inquiry
router.post("/", submitContactInquiry);

// Admin / Staff: List inquiries & update status
router.get("/", getContactInquiries);
router.put("/:id/status", updateInquiryStatus);

export default router;
