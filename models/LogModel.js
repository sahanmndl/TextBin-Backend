import mongoose, {Schema} from "mongoose";
import {collectionNames} from "../utils/constants.js";
import {logTypes} from '../utils/constants.js';

const logSchema = new Schema({
    documentId: {type: Schema.Types.ObjectId, ref: collectionNames.DOCUMENTS, required: true},
    type: {type: Schema.Types.String, enum: Object.keys(logTypes), required: true},
    ipAddress: {type: Schema.Types.String},
    oldData: {type: Schema.Types.Mixed},
    newData: {type: Schema.Types.Mixed},
}, {timestamps: true});

const LogModel = mongoose.model(collectionNames.LOGS, logSchema);
export default LogModel;