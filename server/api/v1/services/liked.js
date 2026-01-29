import likedModel from "../../../models/liked";
import statuss from '../../../enums/status';

const likedServices = {

  createLiked: async (insertObj) => {
    return await likedModel.create(insertObj);
  },

  findLiked: async (query) => {
    return await likedModel.findOne(query);
  },

  updateLiked: async (query, updateObj) => {
    return await likedModel.findOneAndUpdate(query, updateObj, { new: true });
  },

  listLiked: async (query) => {
    return await likedModel.find(query);
  },
  deleteAllLiked: async () => {
    return await likedModel.deleteMany({});
  },

  deleteLiked: async (query) => {
    return await likedModel.findOneAndDelete(query);
  },
  likedListPagination: async (validatedBody) => {
    let query = { status: { $ne: statuss.DELETE } };
    const { page, limit, search } = validatedBody;
    if (search && search != '') {
      query.question = { $regex: search, $options: 'i' }
    }
    let options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { createdAt: -1 }
    };
    return await likedModel.paginate(query, options);
  },
  getAllLiked: async (insertObj) => {
    let query = { status: { $ne: statuss.DELETE } };
    const { search, fromDate, toDate, page, limit, status, reply } = insertObj;

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status
    }
    console.log(reply)
    if (reply) {
      query.reply = reply
    }
    if (fromDate && !toDate) {
      query.createdAt = { $gte: fromDate };
    }
    if (!fromDate && toDate) {
      query.createdAt = { $lte: toDate };
    }
    if (fromDate && toDate) {
      query.$and = [
        { createdAt: { $gte: fromDate } },
        { createdAt: { $lte: toDate } },
      ]
    }

    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 },
      populate: {
        path: "propertyId",
        match: search
          ? { name: { $regex: search, $options: "i" } }
          : {}
      }
    };
    return await likedModel.paginate(query, options);
  },
  viewLiked: async (insertObj) => {
    return await likedModel.findOne(insertObj);
  },
  likedCount: async (query) => {
    return await likedModel.countDocuments(query);
  },

}

module.exports = { likedServices };