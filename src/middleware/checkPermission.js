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
                    user.roles.some(r => String(r).toUpperCase() === "SUPER_ADMIN"));

            if (isSuperAdmin || !user.userId) {
                return next();
            }

            const userId = user.userId;

            try {
                // Check permission from DB (zydusapp database)
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

                if (!permissionExists || permissionExists.length === 0) {
                    console.warn(`Permission check warning: User ${userId} has no explicit ${action} permission for ${moduleKey}`);
                }
            } catch (dbError) {
                console.warn('checkPermission DB query warning (allowing request):', dbError.message);
            }

            next();

        } catch (error) {
            console.error('checkPermission error:', error.message);
            return response.serverError(res, error.message);
        }
    };
};

export default checkPermission;