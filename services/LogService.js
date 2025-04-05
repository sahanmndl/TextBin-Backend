import LogModel from "../models/LogModel.js";
import {logger} from "../config/logger.js";

export const createLog = async ({documentId, type, ipAddress, oldData, newData}) => {
    try {
        const log = await new LogModel({
            documentId,
            type,
            ipAddress,
            oldData,
            newData
        });
        await log.save();
        return log;
    } catch (e) {
        logger.error("Error creating log", e);
        throw e;
    }
}