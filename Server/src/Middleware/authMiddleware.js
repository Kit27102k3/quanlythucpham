import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if(!token) return res.status(401).json({message: "Unauthorized"});

    jwt.verify(token, "SECRET_ACCESS", (err, decode) => {
        if(err) return res.status(403).json({ message: "Invalid token"})

        req.user = decode;
        next();
    })
}