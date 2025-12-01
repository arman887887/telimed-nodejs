import Joi from 'joi';
import { validationError } from '../../utills/sendResponse.js';

const addSchema = Joi.object({

    adminId:Joi.required(),
    UnitNumber:Joi.required(),
    Address:Joi.required(),
    Suburb:Joi.required(),
    StateofTerritory:Joi.required(),
    PostalCode:Joi.required(),
    UnitEquivalentValue:Joi.required(),
    Notes:Joi.required()
});

const updateSchema = Joi.object({
    
    adminId:Joi.optional(),
    UnitNumber:Joi.required(),
    Address:Joi.required(),
    Suburb:Joi.required(),
    StateofTerritory:Joi.required(),
    PostalCode:Joi.required(),
    UnitEquivalentValue:Joi.required(),
    Notes:Joi.required()

});

export const addvalidUnit = (res, data) => {
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

export const updateValidUnit = (res, data) => {
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