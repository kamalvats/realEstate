import Mongoose, { Schema } from "mongoose";
import status from '../enums/status';
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const options = {
    collection: "activity",
    timestamps: true
};

const schemaDefination = new Schema(
    {
        userId: { type: Mongoose.Types.ObjectId, ref: "user" },
        activity: { type: String },
        type: { type: String },
        status: { type: String, default: status.ACTIVE }
    },
    options
);
schemaDefination.plugin(mongoosePaginate);
schemaDefination.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("activity", schemaDefination);

