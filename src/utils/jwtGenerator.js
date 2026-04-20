import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JwtModel = {
  generateToken: async (id, username, role_name, siteId, his_dept, emp_id) => {
    return jwt.sign(
      { id: id, username: username, role_name: role_name, siteId: siteId, his_dept: his_dept, emp_id: emp_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  },
};

export default JwtModel;
