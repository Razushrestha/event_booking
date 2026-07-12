const GenRes = (status, data = null, error = null, message = null, path = null) => {
    const isError = Boolean(error) || status >= 400;
    const timestamp = new Date().toISOString();

    // Log the message
    console.log(`[${timestamp}] ${path}: ${message || (isError ? "Request failed" : "Request successful")}`);

    const response = {
        status,
        success: !isError,
        data,
        error: isError && error ? {
            message: error?.message || "An unexpected error occurred",
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        } : null,
        message: message || (isError ? "Request failed" : "Request successful"),
        timestamp
    };

    if (isError && error) {
        console.error(`[${timestamp}] ERROR at ${path ?? "unknown route"}:`, {
            message: error.message,
            status: status,
            path: path
        });

        // Only log stack in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Stack trace:', error.stack);
        }
    }

    return response;
};

module.exports = GenRes;