import mongoose, {Schema} from "mongoose";
import {collectionNames} from '../utils/constants.js';

const keySchema = new Schema({
    documentId: {type: Schema.Types.ObjectId, ref: collectionNames.DOCUMENTS, required: true},
    encryptionKey: {type: Schema.Types.String},
}, {timestamps: true});

const KeyModel = mongoose.model(collectionNames.KEYS, keySchema);
export default KeyModel;