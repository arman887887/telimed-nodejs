import Joi from 'joi';
import { validationError } from '../../utills/sendResponse.js';

const addSchema = Joi.object({

    adminId: Joi.required(),
    userId: Joi.required(),
    caption: Joi.required()
});
 
const updateSchema = Joi.object({

    adminId: Joi.optional(),
    userId: Joi.optional(),
    caption: Joi.optional(),
    image: Joi.optional(),

  
});

export const addvalidPinboard = (res, data) => {
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

export const updateValidPinboard = (res, data) => {
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