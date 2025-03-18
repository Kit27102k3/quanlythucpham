import express from "express";

const router = express.Router();

import { scrapeWebsite } from "../Controller/scraperController.js";

router.get("/scrape", scrapeWebsite);

export default router;
