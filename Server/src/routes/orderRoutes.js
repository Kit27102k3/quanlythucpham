import express from "express";
const router = express.Router();
import { orderCreate, orderGet, orderGetAll, orderUpdate } from "../Controller/order.js";

router.post("/", orderCreate);
router.patch("/:id", orderUpdate);
router.get("/user", orderGet);
router.get("/", orderGetAll);


export default router;
