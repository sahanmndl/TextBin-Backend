import crypto from "crypto";
import dotenv from "dotenv";
import {logger} from "../config/logger.js";

dotenv.config();

const ALGORITHM = process.env.ENCRYPTION_ALGORITHM;
const IV_LENGTH = parseInt(process.env.IV_LENGTH);

export const generateEncryptionKey = () => {
    try {
        return crypto.randomBytes(32).toString("hex");
    } catch (e) {
        logger.error("Error generating encryption key", e);
        throw new Error("Unable to generate encryption key");
    }
};

export const encryptText = ({text, encryptionKey}) => {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = Buffer.from(encryptionKey, "hex");
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");

        return `${iv.toString("hex")}:${encrypted}`;
    } catch (e) {
        logger.error("Error encrypting text", e);
        throw e;
    }
};

export const decryptText = ({encryptedText, decryptionKey}) => {
    try {
        const [ivHex, encrypted] = encryptedText.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const key = Buffer.from(decryptionKey, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (e) {
        logger.error("Error decryption text", e);
        throw e;
    }
};
