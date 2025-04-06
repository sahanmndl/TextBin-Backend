import {errorAPIResponse, successAPIResponse} from "../utils/response.js";
import {logger} from "../config/logger.js";
import {
    createDocument, deleteDocumentByUser,
    fetchDocumentById,
    fetchDocumentByReadCode, fetchDocumentByUpdateCode, fetchDocumentPrivacyStatus, fetchDocuments,
    updateDocumentByUser
} from "../services/DocumentService.js";

export const newDocument = async (req, res, next) => {
    try {
        const data = req.body;
        const ip = req.ip;
        const response = await createDocument({data, ip});

        return res.status(201).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in newDocument " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
};

export const editDocument = async (req, res, next) => {
    try {
        const updateData = req.body;
        const ip = req.ip;
        const response = await updateDocumentByUser({...updateData, ip});

        if (!response) {
            return res.status(404).json(errorAPIResponse("Document not found"));
        }

        return res.status(200).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in editDocument " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
};

export const getDocumentById = async (req, res, next) => {
    try {
        const {id} = req.params;
        const response = await fetchDocumentById(id);

        return res.status(200).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in getDocumentById " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
};

export const getDocumentPrivacyStatus = async (req, res, next) => {
    try {
        const {code} = req.params;
        const response = await fetchDocumentPrivacyStatus({readCode: code});

        return res.status(200).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in getDocumentPrivacyStatus " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
};

export const getDocumentByReadCode = async (req, res, next) => {
    try {
        const {code} = req.params;
        const {password, key} = req.query;
        const ip = req.ip;

        const response = await fetchDocumentByReadCode({
            readCode: code,
            password: password,
            decryptionKey: key,
            ipAddress: ip
        });

        return res.status(200).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in getDocumentByReadCode " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
};

export const getDocumentByUpdateCode = async (req, res, next) => {
    try {
        const {code} = req.params;
        const response = await fetchDocumentByUpdateCode(code);

        return res.status(200).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in getDocumentByUpdateCode " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
};

export const getDocuments = async (req, res, next) => {
    try {
        const {tags, type, page, limit, sortBy, sortOrder} = req.query;
        const response = await fetchDocuments({
            tags,
            type,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            sortBy,
            sortOrder,
        });

        return res.status(200).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in getDocuments " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
};

export const deleteDocument = async (req, res, next) => {
    try {
        const {id, readCode, updateCode} = req.body;
        const ip = req.ip;
        const response = await deleteDocumentByUser({id, readCode, updateCode, ip});
        return res.status(200).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in deleteDocument " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
}
