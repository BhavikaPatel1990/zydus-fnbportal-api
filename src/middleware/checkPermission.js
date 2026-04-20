import response from '../utils/response.js';

const checkPermission = (permissionKey) => {
    return (req, res, next) => {
        try {
            const user = req.userProfile;
            const permissions = req.permissions;

            if (!user) {
                return response.authError(res, "Unauthorized");
            }

            // SUPER ADMIN bypass
            const isSuperAdmin =
                user.role === "SUPER_ADMIN" ||
                (Array.isArray(user.role) &&
                    user.role.includes("SUPER_ADMIN"));

            if (isSuperAdmin || permissions === "ALL_ACCESS") {
                return next();
            }

            // Check permissions from JWT
            if (!user.permissions || !user.permissions.includes(permissionKey)) {
                return response.error(res, "Forbidden - No permission");
            }

            next();

        } catch (error) {
            return response.serverError(res, error.message);
        }
    };
};

export default checkPermission;