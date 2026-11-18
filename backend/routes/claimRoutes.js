import express from "express";
import {
  createClaim,
  getUserClaims,
  getAllClaimsForAdmin,
  updateClaimStatus,
  downloadSettlementDocument,
} from "../controllers/claimController.js";
import { verifyToken } from "../midleware/verifyToken.js";
import { verifyAdmin } from "../midleware/verifyAdmin.js";

const router = express.Router();
router.get("/getuserclaim", verifyToken, getUserClaims);
router.post("/create", verifyToken, createClaim);
router.get("/:id/settlement-document", verifyToken, downloadSettlementDocument);

// Admin Claim Management Routes
router.get("/all", verifyToken, verifyAdmin, getAllClaimsForAdmin);
router.put("/status/:id", verifyToken, verifyAdmin, updateClaimStatus);

export default router;
