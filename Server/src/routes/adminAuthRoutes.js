import express from "express";
import { adminLogin } from "../Controller/adminAuthController.js";

const router = express.Router();

router.post("/login", adminLogin);

export default router; 