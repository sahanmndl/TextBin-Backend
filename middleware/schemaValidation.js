import {errorAPIResponse} from "../utils/response.js";

export const schemaValidation = (schema, property) => {
    return (req, res, next) => {
        const {error} = schema.validate(req[property]);
        if (error) {
            return res.status(400).json(errorAPIResponse(error.details[0].message, false));
        }
        next();
    };
}