import response from '../utils/response.js';

const checkPermission = (permissionKey) => {
    return (req, res, next) => {
        try {
            const user = req.userProfile;
            const permissions = req.permissions;

            if (!user) {
                return response.authError(res, "Unauthorized");
            }

            // ✅ SUPER_ADMIN bypass (same behavior as before)
            const isSuperAdmin = user.userRoles?.some(
                (ur) => ur.role?.name?.toUpperCase() === "SUPER_ADMIN"
            );


            if (isSuperAdmin || permissions === "ALL_ACCESS") {
                return next();
            }

            // ✅ Check module permission
            const modulePermissions = permissions?.[moduleKey];

            if (!modulePermissions) {
                return response.error(res, "Forbidden - No module access");
            }

            // ✅ Check action
            if (!modulePermissions.includes(action)) {
                return response.error(res, "Forbidden - No permission");
            }

            next();

        } catch (error) {
            return response.serverError(res, error.message);
        }
    };
};

export default checkPermission;