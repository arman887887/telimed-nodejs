import Joi from 'joi';
import { validationError } from '../../utills/sendResponse.js';

const memberSchema = Joi.object({
    adminId: Joi.required(),
    unitId: Joi.required(),
    firstName: Joi.string().trim().required().messages({
        'any.required': 'First Name is required',
    }),

    lastName: Joi.string().trim().required().messages({
        'any.required': 'Last Name is required',
    }),

    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.optional(),

    role: Joi.string().required().messages({
        'any.required': 'Role is required',
    }),

    title: Joi.required(),
    address: Joi.required(),
    phoneNumbers: Joi.required(),

});

const updateSchema = Joi.object({
    adminId: Joi.optional(),
    unitId: Joi.required(),
    profile:Joi.optional(),
    firstName: Joi.string().trim().required().messages({
        'any.required': 'First Name is required',
    }),

    lastName: Joi.string().trim().required().messages({
        'any.required': 'Last Name is required',
    }),


    role: Joi.string().optional().messages({
        'any.required': 'Role is required',
    }),
    
    phoneNumbers: Joi.optional(),
    
    title: Joi.required(),
    address: Joi.required()

});

export const addvalidMember = (res, data) => {
    const { error } = memberSchema.validate(data);

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

export const updateValidMember = (res, data) => {
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