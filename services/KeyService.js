import KeyModel from "../models/KeyModel.js";
import {logger} from "../config/logger.js";

export const createKey = async ({documentId, encryptionKey}) => {
    try {
        const key = await new KeyModel({
            documentId,
            encryptionKey
        });
        await key.save();
        return key;
    } catch (e) {
        logger.error("Error creating key", e);
    }
}