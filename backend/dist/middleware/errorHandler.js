export function errorHandler(err, req, res, next) {
    // #region agent log
    console.error('[ERROR HANDLER]', JSON.stringify({
        method: req.method,
        path: req.path,
        errorName: err.name,
        errorMessage: err.message,
        errorStack: err.stack,
        statusCode: res.statusCode,
    }));
    // #endregion
    console.error('Error:', err);
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
    });
}
//# sourceMappingURL=errorHandler.js.map