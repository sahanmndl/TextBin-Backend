import ReportModel from "../models/ReportModel.js";
import {logger} from "../config/logger.js";
import mongoose from "mongoose";
import DocumentModel from "../models/DocumentModel.js";

export const createReport = async ({readCode, reason, ipAddress}) => {
    try {
        const document = await DocumentModel.findOne({
            active: true,
            readCode: readCode,
        })
            .select('_id')
            .lean()
            .exec();

        if (!document) {
            throw new Error("Document not found");
        }

        const oldReport = await checkIfAlreadyReported({
            documentId: document._id,
            ipAddress
        });
        if (oldReport) {
            throw new Error("You have already reported this document");
        }

        const report = await new ReportModel({
            documentId: document._id,
            reason,
            ipAddress,
        });
        await report.save();

        logger.info(`Document Reported: ${document._id}, ${reason}, ${ipAddress}`);

        return "Document Reported!";
    } catch (e) {
        throw new Error(`Error creating report: ${e.message}`);
    }
}

export const checkIfAlreadyReported = async ({documentId, ipAddress}) => {
    try {
        return await ReportModel.findOne({
            documentId: new mongoose.Types.ObjectId(documentId),
            ipAddress: ipAddress,
        })
            .lean()
            .exec();
    } catch (e) {
        logger.error(`Error checking if already reported: ${e.message}`);
    }
}

export const fetchReportedDocumentsByUser = async ({ipAddress}) => {
    try {
        const reportedDocuments = await ReportModel.find({
            ipAddress: ipAddress,
        })
            .select('documentId')
            .lean()
            .exec();

        const reportedDocumentIds = reportedDocuments.map((doc) => String(doc?.documentId));
        return reportedDocumentIds;
    } catch (e) {
        throw new Error(`Error fetching reported documents: ${e.message}`);
    }
}