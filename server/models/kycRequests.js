import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import Mongoose, { Schema, Types } from "mongoose";

const kycSchema = new Schema(
  {
    /* ================= USER INFO ================= */
    userId: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },
    referenceId:{type:String,unique:true},
    pan:{type:String},
    name:{type:String},
    status:{type:String,enum:["PENDING","APPROVED","REJECTED"],default:"PENDING"},
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */
kycSchema.index({ type: 1, status: 1 });
kycSchema.index({ createdAt: -1 });
kycSchema.index({ propertyId: 1 });
kycSchema.index({ projectId: 1 });
kycSchema.index({ location: "2dsphere" });
kycSchema.plugin(mongooseAggregatePaginate);
kycSchema.plugin(mongoosePaginate);
module.exports = Mongoose.model("kyc", kycSchema);
