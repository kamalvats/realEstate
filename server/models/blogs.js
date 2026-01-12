const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
var schema = mongoose.Schema;
var staticKey = new schema(
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

staticKey.plugin(mongoosePaginate);
module.exports = mongoose.model("blog", staticKey);

