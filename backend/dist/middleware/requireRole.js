export function requireRole(...roles) {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(authReq.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of the following roles: ${roles.join(', ')}. Your current role is: ${authReq.user.role}`
            });
        }
        next();
    };
}
//# sourceMappingURL=requireRole.js.map