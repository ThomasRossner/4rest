import jwt from 'jsonwebtoken';
import { USER_ROLES } from '../constants/enums.js';
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'Authentication not configured' });
    }
    try {
        const decoded = jwt.verify(token, secret);
        if (!decoded ||
            typeof decoded.id !== 'string' ||
            typeof decoded.role !== 'string' ||
            !USER_ROLES.includes(decoded.role)) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        const authReq = req;
        authReq.user = {
            id: decoded.id,
            email: typeof decoded.email === 'string' ? decoded.email : '',
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
//# sourceMappingURL=authenticate.js.map