const mongoose = require('mongoose');
const messages = require('./messages');

const handleValidationError = (error, res) => {
    if (error instanceof mongoose.Error.ValidationError) {
        const validationErrors = {};
        for (const field in error.errors) {
            if (!error.errors[field].message.includes('Cast to [ObjectId] failed for value')) {
                validationErrors[field] = error.errors[field].message;
            }
        }
        return res.status(400).json({
            error: messages.VALIDATION_FAILED,
            validationErrors,
        });
    }
    return null;
};

module.exports = handleValidationError;
