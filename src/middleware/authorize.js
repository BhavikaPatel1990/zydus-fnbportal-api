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
        // console.log(payload);
        // ✅ Attach minimal user info
        req.user = {
            userId: payload.id,
            username: payload.username,
            roles: payload.role_name,
            siteID: payload.siteId
        };

        next();
    } catch (err) {
        console.error("Authorization error:", err.message);

        return response.authError(res, "Invalid or expired token");
    }
};