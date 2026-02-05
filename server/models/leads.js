import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import Mongoose, { Schema, Types } from "mongoose";

const LeadSchema = new Schema(
  {
    /* ================= CORE ================= */
    type: {
      type: String,
      enum: ["enquiry", "site_visit", "callback","info"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["new", "contacted", "closed","cancel"],
      default: "new",
      index: true,
    },

    source: {
      type: String,
      enum: ["web", "mobile", "admin"],
      index: true,
    },

    /* ================= USER INFO ================= */
    userId: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },

    name: {
      type: String,
    },

    mobile: {
      type: String,
      index: true,
    },

    email: {
      type: String,
      index: true,
    },

    /* ================= ENTITY LINK ================= */
    propertyId: {
      type: Types.ObjectId,
      ref: "Property",
      index: true,
    },

   

    /* ================= ENQUIRY ================= */
    message: String,

    /* ================= SITE VISIT ================= */
    preferredDate: Date,
    preferredSlot: String,
    notes: String,

    /* ================= CALLBACK ================= */
    timePreference: String,
  },
  {
    timestamps: true,
  }
);

/* ================= INDEXES ================= */
LeadSchema.index({ type: 1, status: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ propertyId: 1 });
LeadSchema.index({ projectId: 1 });
LeadSchema.index({ location: "2dsphere" });
LeadSchema.plugin(mongooseAggregatePaginate);
LeadSchema.plugin(mongoosePaginate);
module.exports = Mongoose.model("Lead", LeadSchema);
