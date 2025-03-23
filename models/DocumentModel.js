import mongoose, {Schema} from "mongoose";
import {documentTypes, privacyStatus, DEFAULT_EXPIRY_DATE, collectionNames} from '../utils/constants.js';

const documentSchema = new Schema({
    title: {type: Schema.Types.String},
    content: {type: Schema.Types.String, required: true},
    active: {type: Schema.Types.Boolean, default: true},
    tags: {type: [Schema.Types.String], required: true},
    type: {type: Schema.Types.String, enum: [documentTypes.TEXT, documentTypes.CODE], required: true},
    syntax: {type: Schema.Types.String},
    privacy: {type: Schema.Types.String, enum: [privacyStatus.PUBLIC, privacyStatus.PRIVATE], required: true},
    readCode: {type: Schema.Types.String, required: true},
    updateCode: {type: Schema.Types.String, required: true},
    expiryStatus: new Schema({
        isExpiring: {type: Schema.Types.Boolean, default: false},
        expirationDate: {type: Schema.Types.Date, default: DEFAULT_EXPIRY_DATE},
    }, {_id: false}),
    passwordStatus: new Schema({
        isPasswordProtected: {type: Schema.Types.Boolean, default: false},
        password: {type: Schema.Types.String},
    }, {_id: false}),
    isEncrypted: {type: Schema.Types.Boolean, default: false},
    views: {type: Schema.Types.Number, default: 0},
}, {timestamps: true});

const DocumentModel = mongoose.model(collectionNames.DOCUMENTS, documentSchema);
export default DocumentModel;