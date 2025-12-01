import Joi from 'joi';
import { validationError } from '../../utills/sendResponse.js';

const addSchema = Joi.object({
    firstName: Joi.string().trim().optional(),
    lastName: Joi.string().trim().optional(),
    email: Joi.string().email().optional(),
    phoneNumbers: Joi.optional(),
    password: Joi.required(),
    role: Joi.string().required(),
    status: Joi.required(),
    title: Joi.optional(),
    address: Joi.optional()
});

const updateSchema = Joi.object({
    firstName: Joi.optional(),
    lastName: Joi.optional(),
    email: Joi.string().email().optional(),
    phoneNumbers: Joi.optional(),
    role: Joi.string().optional(),
    status: Joi.optional(),
    title: Joi.optional(),
    address: Joi.optional()
});

export const addvalidAdmin = (res, data) => {
    const { error } = addSchema.validate(data);

    if (error) {
        const errorMessages = [];
        error.details.forEach(detail => {
            errorMessages.push(detail.message);
        });
        validationError(res, errorMessages);
        return false;
    }

    return true;
}

export const updateValidAdmin = (res, data) => {
    const { error } = updateSchema.validate(data);

    if (error) {
        const errorMessages = [];
        error.details.forEach(detail => {
            errorMessages.push(detail.message);
        });
        validationError(res, errorMessages);
        return false;
    }

    return true;
}



