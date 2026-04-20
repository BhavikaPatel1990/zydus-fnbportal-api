import axios from "axios";
import response from "../utils/response.js";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

const attachUserProfile = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        const apiRes = await axios.get(
            `${AUTH_SERVICE_URL}/api/user/profile`,
            {
                headers: { Authorization: authHeader },
            }
        );

        const data = apiRes.data.data;

        req.userProfile = data.userProfile;
        req.permissions = data.permissions;
        req.siteId = data.siteId;

        next();
    } catch (err) {
        return response.authError(res, "Unauthorized");
    }
};

export default attachUserProfile;