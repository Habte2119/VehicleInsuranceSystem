// src/routes/policyRoutes.js
import express from "express";
import { verifyToken } from "../midleware/verifyToken.js";
import {
  getAllPoliciess,
  getPolicyById,
  getUserPolicies,
  getUserPoliciesForDashboard,
  getAllPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  downloadPolicyDocument,
} from "../controllers/policyControllers.js";

const route = express.Router();

route.get("/user-policies", verifyToken, getUserPolicies);
route.get("/dashboard", verifyToken, getUserPoliciesForDashboard);
route.get("/get", getAllPoliciess);
// route.get("/:id", getPolicyById);
// route.get("/", getAllPolicies);
route.get("/:policyId/document", verifyToken, downloadPolicyDocument);

route.get("/", getAllPolicies);
route.get("/:id", getPolicyById);
route.post("/", createPolicy);
route.put("/:id", updatePolicy);
route.delete("/:id", deletePolicy);
export default route;
