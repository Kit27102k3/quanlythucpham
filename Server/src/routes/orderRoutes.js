import express from "express";
const router = express.Router();
import { orderCreate, orderGet, orderGetAll, orderUpdate, orderDelete, orderGetById } from "../Controller/order.js";

router.post("/", orderCreate);
router.patch("/:id", orderUpdate);
router.get("/user", orderGet);
router.get("/", orderGetAll);
router.get("/:id", orderGetById);
router.delete("/:id", orderDelete);

export default router;
