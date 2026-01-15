import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import Mongoose, { Schema, Types } from "mongoose";

var staticKey = new Schema(
  {
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCK", "DELETE"],
      default: "ACTIVE",
    },
    img: {
      type: String,
    },
    title: {
      type: String,
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

staticKey.plugin(mongooseAggregatePaginate);
staticKey.plugin(mongoosePaginate);
module.exports = Mongoose.model("blog", staticKey);

