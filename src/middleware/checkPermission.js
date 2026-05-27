import response from '../utils/response.js';
import authPrisma from '../config/authDb.js';

const checkPermission = (moduleKey, action) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                return response.authError(res, "Unauthorized");
            }

            // SUPER_ADMIN bypass
            const isSuperAdmin =
                user.roles === "SUPER_ADMIN" ||
                (Array.isArray(user.roles) &&
                    user.roles.some(r => r.toUpperCase() === "SUPER_ADMIN"));

            if (isSuperAdmin) {
                return next();
            }

            const userId = user.userId;

            // Check permission from DB (zydusapp database)
            // Since we don't have the models in our local schema.prisma, we use $queryRaw
            const permissionExists = await authPrisma.$queryRaw`
                SELECT rp.id
                FROM role_permissions rp
                JOIN user_roles ur ON rp.role_id = ur.role_id
                JOIN modules m ON rp.module_id = m.id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = ${userId}::uuid
                  AND m.module_key = ${moduleKey}
                  AND p.permission_name = ${action}
                LIMIT 1
            `;

            // No permission
            if (!permissionExists || permissionExists.length === 0) {
                // return response.error(res, `Forbidden - No ${action} permission for module: ${moduleKey}`);
                return response.error(res, "Access denied. You do not have sufficient permissions to access this resource.");
            }

            // Allowed
            next();

        } catch (error) {
            console.error('checkPermission error:', error.message);
            return response.serverError(res, error.message);
        }
    };
};

export default checkPermission;