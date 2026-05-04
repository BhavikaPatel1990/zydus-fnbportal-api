import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

export const getOracleConnection = async () => {
  try {
    const connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING,
    });
    return connection;
  } catch (err) {
    console.error('Oracle Connection Error:', err);
    throw err;
  }
};

export default {
  getOracleConnection,
};
