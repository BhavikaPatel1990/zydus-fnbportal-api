import response from '../../utils/response.js';
import logger from '../../utils/logger.js';
import { getProfileByToken } from '../../services/profile/profile.service.js';

export const getProfile = async (req, res) => {
    try {
        const profileData = await getProfileByToken(req.user);
        return response.success(res, 'Profile fetched successfully', profileData);
    } catch (error) {
        logger.error(`Profile error: ${error.message}`);
        return response.error(res, error.message);
    }
};
