import express from "express";
import joi from "joi";
import {privacyStatus, documentTypes} from '../utils/constants.js';
import {schemaValidation} from "../middleware/schemaValidation.js";
import {
    deleteDocument,
    editDocument,
    getDocumentById,
    getDocumentByReadCode,
    getDocumentByUpdateCode, getDocumentPrivacyStatus, getDocuments,
    newDocument
} from "../controllers/DocumentController.js";

const documentRoutes = express.Router();

const schemas = {
    newDocument: joi.object().keys({
        title: joi.string().min(0).max(256).required(),
        content: joi.string().min(1).required(),
        tags: joi.array().items(joi.string()),
        type: joi.string().valid(documentTypes.TEXT, documentTypes.CODE).required(),
        syntax: joi.string().optional(),
        privacy: joi.string().valid(privacyStatus.PUBLIC, privacyStatus.PRIVATE).required(),
        expiryStatus: joi.object().keys({
            isExpiring: joi.boolean(),
            expirationDate: joi.date().allow(null),
        }),
        passwordStatus: joi.object().keys({
            isPasswordProtected: joi.boolean(),
            password: joi.string().allow(null, ""),
        }),
        isEncrypted: joi.boolean(),
    }),
    editDocument: joi.object().keys({
        id: joi.string().required(),
        updateCode: joi.string().required(),
        title: joi.string().min(0).max(256),
        content: joi.string().min(1),
        active: joi.boolean(),
        tags: joi.array().items(joi.string()),
        type: joi.string().valid(documentTypes.TEXT, documentTypes.CODE),
        syntax: joi.string().optional(),
        privacy: joi.string().valid(privacyStatus.PUBLIC, privacyStatus.PRIVATE),
        expiryStatus: joi.object().keys({
            isExpiring: joi.boolean(),
            expirationDate: joi.date().allow(null),
        }),
        passwordStatus: joi.object().keys({
            isPasswordProtected: joi.boolean(),
            password: joi.string().allow(null, ""),
        }),
    }),
    getDocumentById: joi.object().keys({
        id: joi.string().required(),
    }),
    getDocumentPrivacyStatus: joi.object().keys({
        code: joi.string().required(),
    }),
    getDocumentByReadCode: joi.object().keys({
        code: joi.string().required(),
    }),
    getDocumentByUpdateCode: joi.object().keys({
        code: joi.string().required(),
    }),
    getDocuments: joi.object().keys({
        tags: joi.array().items(joi.string()).optional(),
        type: joi.string().valid(documentTypes.TEXT, documentTypes.CODE).optional(),
        page: joi.number().min(1).optional(),
        limit: joi.number().min(1).max(100).optional(),
        sortBy: joi.string().valid("createdAt", "views").optional(),
        sortOrder: joi.string().valid("asc", "desc").optional(),
    }),
    deleteDocument: joi.object().keys({
        id: joi.string().required(),
        readCode: joi.string().required(),
        updateCode: joi.string().required(),
    }),
};

documentRoutes.post("/", schemaValidation(schemas.newDocument, "body"), newDocument);
documentRoutes.put("/", schemaValidation(schemas.editDocument, "body"), editDocument);
// documentRoutes.get("/get/:id", schemaValidation(schemas.getDocumentById, "params"), getDocumentById);
documentRoutes.get("/status/:code", schemaValidation(schemas.getDocumentPrivacyStatus, "params"), getDocumentPrivacyStatus);
documentRoutes.get("/read/:code", schemaValidation(schemas.getDocumentByReadCode, "params"), getDocumentByReadCode);
documentRoutes.get("/update/:code", schemaValidation(schemas.getDocumentByUpdateCode, "params"), getDocumentByUpdateCode);
documentRoutes.get("/", schemaValidation(schemas.getDocuments, "query"), getDocuments);
documentRoutes.post("/delete", schemaValidation(schemas.deleteDocument, "body"), deleteDocument);

export default documentRoutes;