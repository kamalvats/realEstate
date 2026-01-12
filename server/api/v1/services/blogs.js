import blogModel from "../../../models/blogs";
import statuse, { ACTIVE } from "../../../enums/status";
import mongoose from "mongoose"
const blogServices = {

  createBlog: async (insertObj) => {
    return await blogModel.create(insertObj);
  },
  getBlog: async (obj) => {
    return await blogModel.findOne(obj)
  },
  blogCount: async (obj) => {
    return await blogModel.countDocuments(obj);
  },
  updateBlog: async (query, updateObj) => {
    return await blogModel.findOneAndUpdate(query, updateObj, {new: true, upsert: true});
  },
  findBlogs: async (query) => {
    return await blogModel.find(query);
  },
  findBlogsSort: async (query) => {
    return await blogModel.find(query).sort({ airdropAmount: -1 });
  },

  blogAggSearch: async (validatedBody) => {
    const {
      search,
      fromDate,
      toDate,
      page,
      limit,
    } = validatedBody;

    let query = [
      {
        $match: {
          status: { $ne: "Delete" },
        },
      },
    ];
    
    if (search) {
      let searchQuery = {title : { $regex: search, $options: 'i' }}
      query.push({
        $match: {
          $or: [
            searchQuery
          ]
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

   
    let agg = blogModel.aggregate(query);
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 },
    };

    return await blogModel.aggregatePaginate(agg, options);
  },
};

module.exports = {
  blogServices,
};
