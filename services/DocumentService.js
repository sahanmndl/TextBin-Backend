import DocumentModel from "../models/DocumentModel.js";
import {generateRandomString} from "../utils/strings.js";
import {isAfter} from "date-fns";
import {logger} from "../config/logger.js";
import {privacyStatus, redisKeys} from '../utils/constants.js';
import bcrypt from "bcrypt";
import {decryptText, encryptText, generateEncryptionKey} from "../utils/encryption.js";
import {createKey} from "./KeyService.js";
import {deleteDataFromCache, getDataFromCache, setDataInCache} from "../config/cache.js";

export const createDocument = async ({data}) => {
    try {
        let hashedPassword = null;
        if (data.passwordStatus?.isPasswordProtected && data.passwordStatus.password && data.privacy === privacyStatus.PRIVATE) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(data.passwordStatus.password, saltRounds);
        }

        let encryptionKey = null;
        let encryptedTitle = data.title;
        let encryptedContent = data.content;
        if (data.isEncrypted && data.privacy === privacyStatus.PRIVATE) {
            encryptionKey = generateEncryptionKey();
            encryptedTitle = encryptText({
                text: data.title,
                encryptionKey: encryptionKey
            });
            encryptedContent = encryptText({
                text: data.content,
                encryptionKey: encryptionKey
            });
        }

        const document = new DocumentModel({
            ...data,
            title: encryptedTitle,
            content: encryptedContent,
            readCode: generateRandomString(8),
            updateCode: generateRandomString(12),
            passwordStatus: {
                isPasswordProtected: data.passwordStatus?.isPasswordProtected || false,
                password: hashedPassword,
            },
            isEncrypted: data.isEncrypted || false,
        });

        await document.save();

        await setDataInCache({
            cacheKey: `${redisKeys.DOCUMENT}:${document?.readCode}`,
            expiry: 600,
            data: document
        });

        if (data.isEncrypted) {
            await createKey({documentId: document._id, encryptionKey: encryptionKey});
            return {
                document: document,
                decryptionKey: encryptionKey
            };
        }

        return document;
    } catch (e) {
        throw new Error(`Error creating document: ${e.message}`);
    }
};

export const updateDocument = async (
    {id, title, content, active, tags, type, syntax, privacy, expiryStatus, passwordStatus}
) => {
    try {
        const updateBody = {};
        if (title) updateBody.title = title;
        if (content) updateBody.content = content;
        if (active !== undefined) updateBody.active = active;
        if (tags) updateBody.tags = tags;
        if (type) updateBody.type = type;
        if (syntax) updateBody.syntax = syntax;
        if (privacy) updateBody.privacy = privacy;
        if (expiryStatus) updateBody.expiryStatus = expiryStatus;
        if (passwordStatus?.isPasswordProtected && passwordStatus.password) {
            const saltRounds = 10;
            updateBody.passwordStatus = {
                isPasswordProtected: true,
                password: await bcrypt.hash(passwordStatus.password, saltRounds),
            };
        } else if (passwordStatus?.isPasswordProtected === false) {
            updateBody.passwordStatus = {
                isPasswordProtected: false,
                password: null,
            };
        }

        const updatedDocument = await DocumentModel.findByIdAndUpdate(
            id,
            updateBody,
            {new: true, runValidators: true}
        )
            .lean()
            .exec();

        await setDataInCache({
            cacheKey: `${redisKeys.DOCUMENT}:${updatedDocument?.readCode}`,
            expiry: 600,
            data: updatedDocument
        });

        return updatedDocument;
    } catch (e) {
        throw new Error(`Error updating document: ${e.message}`);
    }
}

export const updateDocumentByUser = async (
    {id, updateCode, title, content, active, tags, type, syntax, privacy, expiryStatus, passwordStatus}
) => {
    try {
        const document = await fetchDocumentById(id);

        if (document?.updateCode !== updateCode) {
            throw new Error("Unable to update document");
        }

        return await updateDocument({
            id, title, content, active, tags, type, syntax, privacy, expiryStatus, passwordStatus
        });
    } catch (e) {
        throw new Error(`Error updating document: ${e.message}`);
    }
}

export const fetchDocumentById = async (id) => {
    try {
        const document = await DocumentModel.findById(id).lean().exec();

        if (!document) {
            throw new Error("Document not found.");
        }

        return document;
    } catch (e) {
        throw new Error(`Error fetching document: ${e.message}`);
    }
};

export const fetchDocumentPrivacyStatus = async ({readCode}) => {
    try {
        const document = await DocumentModel.findOne({
            active: true,
            readCode: readCode
        })
            .select('privacy passwordStatus isEncrypted')
            .lean()
            .exec();

        if (!document) {
            throw new Error("Document not found");
        }

        return {
            privacy: document.privacy,
            isPasswordProtected: document.passwordStatus?.isPasswordProtected,
            isEncrypted: document.isEncrypted
        }
    } catch (e) {
        throw new Error(`Error fetching document status: ${e.message}`);
    }
}

export const fetchDocumentByReadCode = async ({readCode, password, decryptionKey}) => {
    try {
        let document = await getDataFromCache({cacheKey: `${redisKeys.DOCUMENT}:${readCode}`});

        if (!document) {
            document = await DocumentModel.findOne({
                active: true,
                readCode: readCode
            })
                .lean()
                .exec();

            if (!document) {
                throw new Error("Document not found");
            }

            await setDataInCache({
                cacheKey: `${redisKeys.DOCUMENT}:${readCode}`,
                expiry: 300,
                data: document
            });
        }

        if (document?.expiryStatus) {
            const hasExpired = await checkDocumentExpiration({id: document._id, expiryStatus: document.expiryStatus});
            if (hasExpired === true) {
                throw new Error("Document has expired");
            }
        }

        if (document.passwordStatus?.isPasswordProtected === true) {
            if (!password) {
                throw new Error("Password is required to access this document.");
            }

            const passwordMatch = await bcrypt.compare(password, document.passwordStatus.password);
            if (!passwordMatch) {
                throw new Error("Invalid password.");
            }
        }

        let decryptedTitle = document.title;
        let decryptedContent = document.content;
        if (document.isEncrypted) {
            if (!decryptionKey) {
                throw new Error("Decryption key is required to access this document.");
            }
            decryptedTitle = decryptText({
                encryptedText: document.title,
                decryptionKey: decryptionKey
            });
            decryptedContent = decryptText({
                encryptedText: document.content,
                decryptionKey: decryptionKey
            });
        }

        await updateDocumentViews(document._id);

        const response = {
            title: decryptedTitle,
            content: decryptedContent,
            tags: document.tags,
            type: document.type,
            syntax: document?.syntax,
            privacy: document.privacy,
            views: document.views,
            readCode: document.readCode,
            expiryStatus: document.expiryStatus,
            createdAt: document.createdAt
        };

        return response;
    } catch (e) {
        throw new Error(`Error fetching document: ${e.message}`);
    }
};

export const fetchDocumentByUpdateCode = async (updateCode) => {
    try {
        const document = await DocumentModel.findOne({
            active: true,
            updateCode: updateCode
        })
            .lean()
            .exec();

        if (!document) {
            throw new Error("Invalid update code or document not found / deleted.");
        }

        if (document?.expiryStatus) {
            const hasExpired = await checkDocumentExpiration({id: document._id, expiryStatus: document.expiryStatus});
            if (hasExpired === true) {
                throw new Error("Document has expired");
            }
        }

        if (document?.isEncrypted) {
            throw new Error("You cannot update an already encrypted document!");
        }

        return document;
    } catch (e) {
        throw new Error(`Error fetching document: ${e.message}`);
    }
};

export const fetchDocuments = async (
    {tags = [], type, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc'}
) => {
    try {
        const skip = (page - 1) * limit;
        const sort = {};
        if (sortBy === 'createdAt' || sortBy === 'views') {
            sort[sortBy] = sortOrder?.toLowerCase() === 'asc' ? 1 : -1;
        }

        const query = {
            active: true,
            privacy: privacyStatus.PUBLIC
        };
        if (tags.length) {
            query.tags = {$in: tags};
        }
        if (type) {
            query.type = type;
        }

        const documents = await DocumentModel
            .find(query)
            .select("-_id title type tags views readCode createdAt")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();

        const totalCount = await DocumentModel.countDocuments(query).exec();
        const totalPages = Math.ceil(totalCount / limit);

        return {
            data: documents,
            pagination: {
                totalCount,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNext: page < totalPages,
            },
        };
    } catch (e) {
        throw new Error(`Error fetching documents: ${e.message}`);
    }
}

export const deleteDocumentByUser = async ({id, readCode, updateCode}) => {
    try {
        const document = await fetchDocumentById(id);

        if (document?.updateCode !== updateCode) {
            throw new Error("Unable to delete document");
        }

        await updateDocument({
            id: id,
            active: false
        });

        await deleteDataFromCache({cacheKey: `${redisKeys.DOCUMENT}:${readCode}`});

        return "Document deleted";
    } catch (e) {
        throw new Error(`Error deleting document: ${e.message}`);
    }
}

const checkDocumentExpiration = async ({id, expiryStatus}) => {
    try {
        let hasExpired = false;
        const isExpiring = expiryStatus?.isExpiring;
        if (isExpiring === true) {
            const currentDate = new Date();
            const expirationDate = expiryStatus?.expirationDate;
            if (isAfter(currentDate, expirationDate)) {
                hasExpired = true;
                await updateDocument({id: id, active: false});
            }
        }
        return hasExpired;
    } catch (e) {
        logger.error("Error checking document expiration date", e.message);
        return false;
    }
}

const updateDocumentViews = async (id) => {
    try {
        const document = await DocumentModel.findByIdAndUpdate(
            id,
            {$inc: {views: 1}},
            {new: true, lean: true}
        )
            .lean()
            .exec();

        if (!document) {
            throw new Error("Document not found");
        }

        return document.views;
    } catch (e) {
        logger.error("Error updating document views", e.message);
    }
}
