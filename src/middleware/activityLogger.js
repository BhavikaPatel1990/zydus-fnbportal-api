import logger from "../utils/logger.js";

export const activityLogger = (moduleName) => {
    return (req, res, next) => {
        res.on("finish", async () => {
            try {
                if (!req.user) return;

                const actionMap = {
                    POST: "CREATE",
                    GET: "READ",
                    PUT: "UPDATE",
                    DELETE: "DELETE"
                };

                const action = actionMap[req.method] || req.method;
                const userId = req.user.userId || req.user.id;
                const username = req.user.username || req.user.email;

                const logData = {
                    user_id: userId,
                    username: username,
                    action_type: action,
                    module_name: moduleName,
                    description: `${req.method} ${req.originalUrl}`,
                    ip_address: req.ip || req.connection?.remoteAddress,
                    user_agent: req.headers["user-agent"],
                    request_url: req.originalUrl,
                    method: req.method,
                    status_code: res.statusCode,
                };

                logger.info(`ACTIVITY: ${JSON.stringify(logData)}`);
            } catch (err) {
                logger.error(`Activity log error: ${err.message}`);
            }
        });

        next();
    };
};