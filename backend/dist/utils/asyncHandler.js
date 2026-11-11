/**
 * Wraps async route handlers to automatically catch errors and pass them to error middleware
 * Eliminates repetitive try/catch blocks in controllers (DRY principle)
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map