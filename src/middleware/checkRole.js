import response from '../utils/response.js';

const checkRole = (...roles) => {
    return (req, res, next) => {
        const userRoles = req.userProfile?.userRoles;

        if (!userRoles) {
            return response.authError(res, "Unauthorized: No role found");
        }

        const roleNames = userRoles.map(r => r.role?.name?.toUpperCase());

        const hasRole = roles.some(role =>
            roleNames.includes(role.toUpperCase())
        );

        if (!hasRole) {
            return response.error(res, "Access denied: Insufficient role");
        }

        next();
    };
};

export default checkRole;