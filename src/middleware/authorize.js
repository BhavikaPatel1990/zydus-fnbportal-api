import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import response from '../utils/response.js';
dotenv.config();

export const authorize = async (req, res, next) => {
  try {
    // Get token from the header
    const token = req.header("Authorization")?.split(" ")[1]; // Expected: "Bearer <token>"

    if (!token) {
      return response.authError(res, "Unauthorized: No token provided");
    }

    // Verify the token (uses same JWT_SECRET as zydus-api)
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to the request
    req.user = payload;

    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('Authorization error:', err.message);
    return response.authError(res, "Unauthorized: Invalid token");
  }
};
