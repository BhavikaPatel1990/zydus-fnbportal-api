import response from '../utils/response.js';

const checkRole = (...roles) => {
    return (req, res, next) => {
        const userRoles = req.user?.role_name;

        if (!userRoles) {
            return response.authError(res, "Unauthorized: No role found");
        }

        // Support both string and array role_name from JWT
        const userRoleList = Array.isArray(userRoles) ? userRoles : [userRoles];

        const hasRole = userRoleList.some(role =>
            roles.map(r => r.toUpperCase()).includes(role.toUpperCase())
        );

        if (!hasRole) {
            return response.error(res, "Access denied: Insufficient role");
        }

        next();
    };
};

export default checkRole;
