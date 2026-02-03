import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import ticketStatus from "../enums/requestStatus";
import mongoose from "mongoose";

var transactionModel = new Schema(
  {
    userId: {
      type: Mongoose.Types.ObjectId,
      ref: "user",
    },
    projectId: {
      type: mongoose.Types.ObjectId,
      ref: "projects",
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      enum :["PENDING","REJECT","APPROVE","COMPLETED"],
      default: "COMPLETED",
    },
    transactionType: {
      type: String,
      enum: ["TOKEN"],
    },
    orderId: {
      type: String,
    },
    towerId:{
      type: String,
    },
    floorId:{
      type: String,
    },
    unitId:{
      type: String,
    },
    name:{
      type: String,
    },
    mobileNumber:{
      type: String,
    },
    note:{
      type: String,
    },
  },
  { timestamps: true }
);

transactionModel.plugin(mongooseAggregatePaginate);
transactionModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("transaction", transactionModel);
