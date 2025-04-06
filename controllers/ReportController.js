import {createReport, fetchReportedDocumentsByUser} from "../services/ReportService.js";
import {errorAPIResponse, successAPIResponse} from "../utils/response.js";
import {logger} from "../config/logger.js";

export const newReport = async (req, res, next) => {
    try {
        const {readCode, reason} = req.body;
        const ip = req.ip;

        const response = await createReport({
            readCode,
            reason,
            ipAddress: ip
        });

        return res.status(201).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in newReport " + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
}

export const getReportedDocumentsByUser = async (req, res, next) => {
    try {
        const ip = req.ip;
        const response = await fetchReportedDocumentsByUser({ipAddress: ip});
        return res.status(200).json(successAPIResponse(response));
    } catch (e) {
        logger.error("Error in getReportedDocumentsByUser" + e.message);
        return res.status(500).json(errorAPIResponse(e.message));
    }
}