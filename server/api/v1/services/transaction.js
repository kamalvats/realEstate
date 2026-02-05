import transactionModel from "../../../models/transaction";
import statuse, { ACTIVE } from "../../../enums/status";
import mongoose from "mongoose"
const transactionServices = {
  createTransaction: async (insertObj) => {
    return await transactionModel.create(insertObj);
  },
  graphTransactionAggrigate: async (insertObj) => {
    return await transactionModel.aggregate(insertObj);
  },

  getTransaction: async (obj) => {
    return await transactionModel.findOne(obj).populate("userId");
  },
  transactionCount: async (obj) => {
    return await transactionModel.countDocuments(obj);
  },
  updateTransaction: async (query, updateObj) => {
    return await transactionModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },

  findTransactions: async (query) => {
    return await transactionModel.find(query);
  },
    updateManyTransaction: async (query, updateObj) => {
      return await transactionModel
        .updateMany(query, updateObj, { new: true })
    },

  transactionPaginateSearch: async (validatedBody) => {
    const {
      search,
      fromDate,
      toDate,
      page,
      limit,
      userId,
      status,
      projectId,
      propertyStatus
    } = validatedBody;
    let query = [
      {
        $match:{status:{$ne:"PENDING"}}
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userdf'
        }
      },
      {
        $unwind: {path: '$userdf', preserveNullAndEmptyArrays: true}
      },
      {
        $lookup: {
          from: 'properties',
          localField: 'projectId',
          foreignField: '_id',
          as: 'projectId'
        }
      },
      {
        $unwind: {path: '$projectId', preserveNullAndEmptyArrays: true}
      },
      {
        $project: {
          createdAt: 1,
          orderId: 1,
          amount: 1,
          status: 1,
          projectId: 1,
          email: '$userdf.email',
          userId: '$userdf._id',
          towerId:1,
          floorId:1,
          unitId:1,
          name:1,
          mobileNumber:1,
          note:1
          
         
        }
      }, {
        $sort: { createdAt: -1 }
      },
      {
      $match: {
        "projectId.propertyStatus": "ACTIVE" // ✅ only ACTIVE
      }
    }
    ];


    if (userId) {
      query.push({
        $match: {
          userId: mongoose.Types.ObjectId(userId),
        }
      });
    }
    if(projectId){
      query.push({
        $match: {
          "projectId._id": mongoose.Types.ObjectId(projectId),
        }
      });
    }

   

    
    if (search) {
      query.push({
        $match: {
          $or: [
            { "projectId.title": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    if (status) {
      query.push({
        $match: {
          status: status
        }
      });
    }

    if(propertyStatus){
      query.push({
        $match: {
          "projectId.status": propertyStatus
        }
      });
    }

    if (fromDate && !toDate) {
      query.push({
        $match: {
          createdAt: {
            $gte: new Date(new Date(fromDate).toISOString().slice(0, 10))
          }
        }
      });
    }

    if (!fromDate && toDate) {
      query.push({
        $match: {
          createdAt: {
            $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z")
          }
        }
      });
    }

    if (fromDate && toDate) {
      query.push({
        $match: {
          $and: [
            {
              createdAt: {
                $gte: new Date(new Date(fromDate).toISOString().slice(0, 10))
              }
            },
            {
              createdAt: {
                $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z")
              }
            }
          ]
        }
      });
    }
    let agg = transactionModel.aggregate(query);
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };

    return await transactionModel.aggregatePaginate(agg, options);
  },
 
};

module.exports = {
  transactionServices,
};
