import response from '../../utils/response.js';
import * as inpatientService from '../../services/ipd/inpatient.service.js';
import authPrisma from '../../config/authDb.js';

/**
 * Controller to fetch inpatient list from Oracle
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const fetchInpatients = async (req, res) => {
  try {
    const siteId = req.user.siteID;
    
    
    if (!siteId) {
      return response.serverError(res, 'Site ID is missing in user profile');
    }

    // Get actual site_id from mst_sites table in zydusapp database
    const siteResults = await authPrisma.$queryRaw`SELECT site_id FROM mst_sites WHERE id = ${parseInt(siteId)}`;
    
    if (!siteResults || siteResults.length === 0 || !siteResults[0].site_id) {
      return response.serverError(res, 'Invalid site configuration or actual site ID not found');
    }

    const actualSiteId = siteResults[0].site_id;
    // console.log("Actual Oracle Site ID:", actualSiteId);

    const data = await inpatientService.getInpatients(actualSiteId);
    
    return response.success(res, 'Inpatient list fetched successfully', data);
  } catch (error) {
    console.error('fetchInpatients error:', error.message);
    return response.serverError(res, 'Failed to fetch inpatient list from Oracle');
  }
};

export default {
  fetchInpatients,
};
