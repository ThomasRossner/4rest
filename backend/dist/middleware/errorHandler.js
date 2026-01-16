export function errorHandler(err, req, res, next) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/17f21783-26de-498c-a621-6ba896fb1ded', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'errorHandler.ts:9', message: 'errorHandler entry', data: { method: req.method, path: req.path, errorName: err.name, errorMessage: err.message, statusCode: res.statusCode }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
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