import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import response from "../utils/response.js";

dotenv.config();

export const authorize = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return response.authError(res, "No Authorization header");
        }

        // ✅ Validate Bearer format
        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return response.authError(res, "Invalid token format");
        }

        const token = parts[1];

        // ✅ Verify JWT
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Attach minimal user info
        req.user = {
            userId: payload.userId,
            username: payload.username,
            roles: payload.roles || []
        };

        next();
    } catch (err) {
        console.error("Authorization error:", err.message);

        return response.authError(res, "Invalid or expired token");
    }
};