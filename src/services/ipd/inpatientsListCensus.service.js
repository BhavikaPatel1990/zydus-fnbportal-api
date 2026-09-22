import { getOracleConnection } from '../../config/oracleDb.js';
import oracledb from 'oracledb';
import prisma from '../../config/db.js';

const createHttpError = (message, statusCode = 200) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createNormalError = (message) => createHttpError(message, 200);
const createBadRequestError = (message) => createHttpError(message, 400);

/**
 * Convert object keys to snake_case + lowercase
 */
const toSnakeCase = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase(),
      value,
    ])
  );
};
/**
 * Fetch inpatient list from Oracle database
 * @param {number|string} siteId - The site ID to filter by
 * @returns {Promise<Array>} - List of inpatients
 */
export const getInpatientsListCensus = async (siteId) => {
  let connection;

  if (siteId === undefined || siteId === null || siteId === '') {
    throw createNormalError('Site ID is required');
  }

  try {
    connection = await getOracleConnection();

    const sql = `
      SELECT 
        p.mrno,
        pm2.prefix || ' ' || p.patientname AS PATIENT,
        ip.admissionnumber,
        b.bed_id,
        b.bed_no,
        sc.service_center_name,
        pm.prefix || ' ' || e.employee_name AS DOCTOR 
      FROM inpatients ip 
      LEFT JOIN visit v ON v.visitid = ip.visitid
      LEFT JOIN patient p ON p.patient_id = ip.patient
      LEFT JOIN bed b ON b.bed_id = ip.bed
      LEFT JOIN employee e ON e.employee_id = ip.consultant
      LEFT JOIN prefix_master pm ON pm.id = e.emp_prefix
      LEFT JOIN prefix_master pm2 ON pm2.id = p.patprefix
      LEFT JOIN servicecenter sc ON sc.service_center_id = b.servicecenter
      LEFT JOIN discharge d ON d.visit = v.visitid 
      WHERE ip.ADMITTED_SITE = :siteId 
        AND d.dateofdischarge IS NULL 
        AND ip.visit_patientstatus <> 1122
        ORDER BY b.bed_no ASC
    `;

    const result = await connection.execute(
      sql,
      { siteId: siteId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
  
    // Convert all response keys to snake_case lowercase
    return result.rows.map(toSnakeCase);
  } catch (err) {
    console.warn('Error fetching inpatients list from Oracle DB, falling back to local DB:', err.message);

    if (err?.statusCode === 200) {
      throw err;
    }

    try {
      const parsedSiteId = Number(siteId);
      const localOrders = await prisma.hinaiOrder.findMany({
        where: {
          is_discharge: false,
          ...(parsedSiteId ? { mst_id: BigInt(parsedSiteId) } : {})
        },
        orderBy: { bed_no: 'asc' },
      });

      const map = new Map();
      for (const order of localOrders) {
        if (!map.has(order.patient_id)) {
          map.set(order.patient_id, {
            mrno: order.mr_no ? String(order.mr_no) : '',
            patient: order.patient_name || '',
            admissionnumber: order.admission_no || '',
            bed_id: 0,
            bed_no: order.bed_no || '',
            service_center_name: order.ward || '',
            doctor: order.doctor || ''
          });
        }
      }
      return Array.from(map.values());
    } catch (localErr) {
      console.error('Local fallback error in getInpatientsListCensus:', localErr);
      throw createBadRequestError(err.message || 'Failed to fetch inpatient list');
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing Oracle connection:', err);
      }
    }
  }
};

export default {
  getInpatientsListCensus,
};
