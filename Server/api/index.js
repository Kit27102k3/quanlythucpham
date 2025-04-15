import express from "express";
import serverless from "serverless-http";

const app = express();
const router = express.Router();

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from Vercel Express" });
});

app.use("/api", router);

export default serverless(app);
