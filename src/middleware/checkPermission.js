import authPrisma from '../config/authDb.js';
import response from '../utils/response.js';

const checkPermission = (moduleKey, action) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                return response.authError(res, "Unauthorized");
            }

            const isSuperAdmin =
                user.role_name === "SUPER_ADMIN" ||
                (Array.isArray(user.role_name) &&
                    user.role_name.some((role) => role.toUpperCase() === "SUPER_ADMIN"));

            if (isSuperAdmin) {
                return next();
            }

            const userId = user.id;

            const permissionExists = await authPrisma.rolePermission.findFirst({
                where: {
                    role: {
                        userRoles: {
                            some: {
                                user_id: userId
                            }
                        }
                    },
                    module: {
                        module_key: moduleKey
                    },
                    permission: {
                        permission_name: action
                    }
                }
            });

            if (!permissionExists) {
                return response.error(res, "Forbidden - No permission");
            }

            next();
        } catch (error) {
            return response.serverError(res, error.message);
        }
    };
};

export default checkPermission;
