import mongoose from 'mongoose';
const schema = mongoose.Schema;
import mongoosePaginate from 'mongoose-paginate';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate';
import status from '../enums/status'
const likedSchema = new schema({

   userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'property'
    },
    
}, { timestamps: true })

likedSchema.plugin(mongoosePaginate);
likedSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model("liked", likedSchema);