import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
export function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing auth token" });
        }
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            displayName: decoded.displayName,
            role: decoded.role
        };
        return next();
    }
    catch (error) {
        return res.status(401).json({ error: "Invalid auth token" });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }
        return next();
    };
}
