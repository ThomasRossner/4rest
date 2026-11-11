export function validateRequest(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            res.status(400).json({
                error: 'Validation error',
                details: error.errors,
            });
        }
    };
}
//# sourceMappingURL=validateRequest.js.map