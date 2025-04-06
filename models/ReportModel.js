import mongoose, {Schema} from "mongoose";
import {collectionNames} from "../utils/constants.js";

const reportSchema = new Schema({
    documentId: {type: Schema.Types.ObjectId, ref: collectionNames.DOCUMENTS, required: true},
    reason: {type: Schema.Types.String},
    ipAddress: {type: Schema.Types.String},
}, {timestamps: true});

const ReportModel = mongoose.model(collectionNames.REPORTS, reportSchema);
export default ReportModel;