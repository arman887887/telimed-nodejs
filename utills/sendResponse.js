export const sendSuccess = (res, data, message = '') => {
    return res.status(200).json({
        status: 'success',
        message,
        data
    });
};

export const created = (res, message = 'Success') => {
    return res.status(201).json({
        status: 'success',
        message
    });
};

export const Unauthorized = (res, data, message = '') => {
    return res.status(401).json({
        status: 'Unauthorized',
        message,
        data
    });
};

export const sendError = (res, error, message = '') => {
    console.error(error); 
    return res.status(400).json({
        status: 'error',
        message,
        error: error
    });
};

export const validationError = (res, errors) => {
    return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
    });
};

export const replaceNullWithEmptyString = (user) => {
    const userWithEmptyStrings = {};
    for (const [key, value] of Object.entries(user)) {
        userWithEmptyStrings[key] = value !== null ? value : '';
    }
    return userWithEmptyStrings;
};

export const sendInfo = (res, data, message = '') => {
    return res.status(200).json({
        status: 'info', 
        message,
        data
    });
};
