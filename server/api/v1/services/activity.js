import activityModel from "../../../models/activity";
import statuse, { ACTIVE } from "../../../enums/status";
import mongoose from "mongoose"
const activityServices = {

  createActivity: async (insertObj) => {
    return await activityModel.create(insertObj);
  },
  getActivity: async (obj) => {
    return await activityModel.findOne(obj)
  },
  activityCount: async (obj) => {
    return await activityModel.countDocuments(obj);
  },
  updateActivity: async (query, updateObj) => {
    return await activityModel.findOneAndUpdate(query, updateObj, {new: true, upsert: true});
  },
  findActivitys: async (query) => {
    return await activityModel.find(query);
  },
  findActivitysSort: async (query) => {
    return await activityModel.find(query).sort({ airdropAmount: -1 });
  },

  activityAggSearch: async (validatedBody) => {
    const {
      search,
      fromDate,
      toDate,
      page,
      limit,
      userId
    } = validatedBody;

    let query = [
      {
        $match: {
          status: { $ne: "Delete" },
        },
      },
    ];
    
    if (search) {
      let searchQuery = {name : { $regex: search, $options: 'i' }}
      query.push({
        $match: {
          $or: [
            searchQuery
          ]
        }
      });
    }
    if(userId){
      query.push({
        $match: {
          userId: mongoose.Types.ObjectId(userId)
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

   
    let agg = activityModel.aggregate(query);
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 },
    };

    return await activityModel.aggregatePaginate(agg, options);
  },
};

module.exports = {
  activityServices,
};
