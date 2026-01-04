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
      transactionType,
      userId,
      status,
      notEqual,
      campaignId,
      isClaimed,
      isCompleted
    } = validatedBody;
    let query = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userdf'
        }
      },
      {
        $unwind: '$userdf'
      },
      {
        $lookup: {
          from: 'campaigns',
          localField: 'campaignId',
          foreignField: '_id',
          as: 'campaignId'
        }
      },
      {
        $unwind: '$campaignId'
      },
      {
        $project: {
          token: 1,
          transactionType: 1,
          createdAt: 1,
          hash: 1,
          amount: 1,
          status: 1,
          walletAddress: 1,
          email: '$userdf.email',
          userId: '$userdf._id',
          walletAddress:`$userdf.walletAddress`,
          campaignId:1,
          isClaimed:1,
          isCompleted:1
         
        }
      }, {
        $sort: { createdAt: -1 }
      }
    ];


    if (userId) {
      query.push({
        $match: {
          userId: mongoose.Types.ObjectId(userId),
        }
      });
    }
    if(campaignId){
      query.push({
        $match: {
          "campaignId._id": mongoose.Types.ObjectId(campaignId),
        }
      });
    }

    if (transactionType) {
      query.push({
        $match: {
          transactionType: transactionType
        }
      });
    }
    if (notEqual) {
      query.push({
        $match: notEqual
      });
    }
    if(isClaimed ==true || isClaimed ==false){
      query.push({
        $match: {
          isClaimed: isClaimed
        }
      });
    }
    if(isCompleted ==true || isCompleted ==false){
      query.push({
        $match: {
          isCompleted: isCompleted
        }
      });
    }

    
    if (search) {
      let searchQuery = {};
    
      try {
       const objectId = mongoose.Types.ObjectId(search);
        searchQuery._id = objectId;
      } catch (error) {
       searchQuery.walletAddress = { $regex: search, $options: 'i' };
      }
    
      query.push({
        $match: {
          $or: [
            searchQuery
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
