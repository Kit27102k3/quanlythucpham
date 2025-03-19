import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, "SECRET_ACCESS", (err, decode) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = decode;
    next();
  });
};
