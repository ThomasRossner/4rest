export function errorHandler(err, req, res, next) {
    console.error('[ERROR HANDLER] Error:', err);
    console.error('[ERROR HANDLER] Error name:', err.name);
    console.error('[ERROR HANDLER] Error message:', err.message);
    console.error('[ERROR HANDLER] Error stack:', err.stack);
    console.error('[ERROR HANDLER] Request path:', req.path);
    console.error('[ERROR HANDLER] Request method:', req.method);
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: err.message,
        });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: err.message,
        });
    }
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
//# sourceMappingURL=errorHandler.js.map