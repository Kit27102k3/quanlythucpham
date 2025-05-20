import express from "express";
import brandRoute from "../Route/brandRoute.js";

const router = express.Router();

router.use("/", brandRoute);

export default router; 