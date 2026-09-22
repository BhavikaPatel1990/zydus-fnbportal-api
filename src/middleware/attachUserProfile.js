import axios from "axios";
import response from "../utils/response.js";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL?.replace(/\/$/, '');

const getUserProfileApiUrl = () => {
    if (!AUTH_SERVICE_URL) {
        return null;
    }

    return AUTH_SERVICE_URL.endsWith('/api')
        ? `${AUTH_SERVICE_URL}/user/profile`
        : `${AUTH_SERVICE_URL}/api/user/profile`;
};

const attachUserProfile = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        const profileUrl = getUserProfileApiUrl();
        if (profileUrl && authHeader) {
            const apiRes = await axios.get(
                profileUrl,
                {
                    headers: { Authorization: authHeader },
                    timeout: 3000,
                }
            );

            const data = apiRes.data?.data;
            if (data) {
                req.userProfile = data.userProfile;
                req.permissions = data.permissions;
                req.siteId = data.siteId;
            }
        }

        next();
    } catch (err) {
        console.warn("attachUserProfile call warning (continuing with JWT payload):", err.message);
        if (req.user) {
            return next();
        }
        return response.authError(res, "Unauthorized");
    }
};

export default attachUserProfile;
