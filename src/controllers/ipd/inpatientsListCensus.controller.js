import response from '../../utils/response.js';
import * as inpatientsListCensusService from '../../services/ipd/inpatientsListCensus.service.js';
import authPrisma from '../../config/authDb.js';

const handleInpatientsError = (res, error, fallbackMessage) => {
  const message = error?.message || fallbackMessage;

  if (error?.statusCode === 401) {
    return response.authError(res, message);
  }

  if (error?.statusCode === 403) {
    return response.error(res, message);
  }

  if (error?.statusCode === 400) {
    return response.serverError(res, message);
  }

  return response.normalError(res, message);
};

/**
 * Controller to fetch inpatient list from Oracle
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const fetchInpatientsListCensus = async (req, res) => {
  try {
    const siteId = req.user.siteID;


    if (!siteId) {
      return response.normalError(res, 'Site ID is missing in user profile');
    }

    // Get actual site_id from mst_sites table in zydusapp database
    const siteResults = await authPrisma.$queryRaw`SELECT site_id FROM mst_sites WHERE id = ${parseInt(siteId)}`;

    if (!siteResults || siteResults.length === 0 || !siteResults[0].site_id) {
      return response.normalError(res, 'Invalid site configuration or actual site ID not found');
    }

    const actualSiteId = siteResults[0].site_id;
    // console.log("Actual Oracle Site ID:", actualSiteId);

    const data = await inpatientsListCensusService.getInpatientsListCensus(actualSiteId);

    return response.success(res, 'Inpatient list fetched successfully', data);
  } catch (error) {
    console.error('fetchInpatients error:', error.message);
    return handleInpatientsError(res, error, 'Failed to fetch inpatient list from Oracle');
  }
};

export default {
  fetchInpatientsListCensus,
};
