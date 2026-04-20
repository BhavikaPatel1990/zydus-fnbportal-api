import authPrisma from '../../config/authDb.js';

const toSafeJson = (data) => JSON.parse(
    JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
);

export const getProfileByToken = async (jwtUser) => {
    if (!jwtUser?.id) {
        throw new Error('Unauthorized: Invalid token payload');
    }

    const user = await authPrisma.users.findFirst({
        where: {
            id: jwtUser.id,
            status: true,
            is_active: true,
        },
        include: {
            userSites: {
                include: { site: true },
            },
            userRoles: {
                include: { role: true },
            },
        },
    });

    if (!user) {
        throw new Error('User not found or inactive in local system');
    }

    const safeUser = toSafeJson(user);
    const requestedSiteId = jwtUser.siteId;

    if (requestedSiteId) {
        const siteAllowed = safeUser.userSites?.some(
            (site) => String(site.site?.id ?? site.site_id) === String(requestedSiteId)
        );

        if (!siteAllowed) {
            throw new Error('User not allowed for this site');
        }
    }

    const isSuperAdmin = safeUser.userRoles?.some(
        (item) => item.role?.name?.toUpperCase() === 'SUPER_ADMIN'
    );

    let permissions = {};

    if (isSuperAdmin) {
        permissions = 'ALL_ACCESS';
    } else {
        const roleIds = safeUser.userRoles?.map((item) => item.role_id) ?? [];

        const rolePermissions = await authPrisma.rolePermission.findMany({
            where: {
                role_id: { in: roleIds },
            },
            include: {
                permission: true,
                module: true,
            },
        });

        rolePermissions.forEach((item) => {
            const moduleKey = item.module.module_key;
            const permissionName = item.permission.permission_name;

            if (!permissions[moduleKey]) {
                permissions[moduleKey] = [];
            }

            if (!permissions[moduleKey].includes(permissionName)) {
                permissions[moduleKey].push(permissionName);
            }
        });
    }

    const hasPortalAccess = isSuperAdmin || Boolean(permissions.FNB_PORTAL);

    if (!hasPortalAccess) {
        throw new Error('Access denied: You do not have permissions for FNB Portal');
    }

    return {
        userProfile: safeUser,
        permissions,
        siteId: requestedSiteId ?? null,
    };
};
