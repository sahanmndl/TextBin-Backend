import express from "express";
import joi from "joi";
import {schemaValidation} from "../middleware/schemaValidation.js";
import {getReportedDocumentsByUser, newReport} from "../controllers/ReportController.js";

const reportRoutes = express.Router();

const schemas = {
    newReport: joi.object().keys({
        readCode: joi.string().required(),
        reason: joi.string().allow("").optional()
    })
}

reportRoutes.post('/', schemaValidation(schemas.newReport, "body"), newReport);
// reportRoutes.get('/', getReportedDocumentsByUser);

export default reportRoutes;