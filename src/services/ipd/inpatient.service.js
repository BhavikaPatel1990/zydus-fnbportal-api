import { getOracleConnection } from '../../config/oracleDb.js';
import oracledb from 'oracledb';

/**
 * Fetch inpatient list from Oracle database
 * @param {number|string} siteId - The site ID to filter by
 * @returns {Promise<Array>} - List of inpatients
 */
export const getInpatients = async (siteId) => {
  let connection;

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
    `;

    const result = await connection.execute(
      sql,
      { siteId: siteId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } catch (err) {
    console.error('Error in getInpatients service:', err);
    throw err;
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
  getInpatients,
};
