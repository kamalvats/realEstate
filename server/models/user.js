import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
import status from "../enums/status";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { type } from "joi/lib/types/object";

var userModel = new Schema(
  {
    email: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    userName: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpVerified: {
      type: Boolean,
      default: true,
    },
    userType: {
      type: String,
      enum: [userType.ADMIN, userType.SUBADMIN, userType.USER],
      default: userType.USER,
    },
    status: {
      type: String,
      enum: [status.ACTIVE, status.BLOCK, status.DELETE],
      default: status.ACTIVE,
    },
    otpExpireTime: {
      type: Number,
    },
    base64: {
      type: String
    },
    permissions: [],
    password: { type: String },
    kyc: { type: Boolean, default: false },
    preferredArea:{type:String},
    budgetStart:{type:Number},
    budgetEnd:{type:Number},
    mobileNumber:{type:String},
    countryCode:{type:String},
    dateOfBirth:{type:String},
    address:{type:String},
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
  },


  { timestamps: true }
);

userModel.index({ location: "2dsphere" });
userModel.plugin(mongooseAggregatePaginate);
userModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("user", userModel);

(async () => {
  let result = await Mongoose.model("user", userModel).find({
    userType: userType.ADMIN,
  });

  if (result.length != 0 && result.userType != "ADMIN") {
    console.log("Default Admin updated.");
  } else {
    let obj = {
      userType: userType.ADMIN,
      firstName: "admin",
      lastName: "admin",
      userName: "Admin123",
      countryCode: "+91",
      mobileNumber: "123456789",
      email: "estate@mailinator.com",
      dateOfBirth: "13/01/2003",
      password: bcrypt.hashSync("Admin@123"),
      address: "Delhi, India",
      otpVerified: true,
    };
    var defaultResult = await Mongoose.model("user", userModel).create(obj);
  }

  if (defaultResult) {
    console.log("DEFAULT DATA Created.", defaultResult);
  }
}).call();
