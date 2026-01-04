import propertiesModel from "../../../models/property";
import statuse, { ACTIVE } from "../../../enums/status";
import mongoose from "mongoose"
const propertiesServices = {

  createProperties: async (insertObj) => {
    return await propertiesModel.create(insertObj);
  },
  getProperties: async (obj) => {
    return await propertiesModel.findOne(obj)
  },
  propertiesCount: async (obj) => {
    return await propertiesModel.countDocuments(obj);
  },
  updateProperties: async (query, updateObj) => {
    return await propertiesModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },
  findPropertiess: async (query) => {
    return await propertiesModel.find(query);
  },
  findPropertiessSort: async (query) => {
    return await propertiesModel.find(query).sort({ airdropAmount: -1 });
  },

  propertiesAggSearch: async (filters) => {
    const {
      search,
      city,
      zone,
      type,
      bhk,
      possessionDate,
      space,
      reraRegistered,
      virtualTourAvailable,
      minPrice,
      maxPrice,
      minToken,
      maxToken,
      latitude,
      longitude,
      radius,
      status,
      verified,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      propertyStatus
    } = filters;

    const pipeline = [];

    /* ================= GEO FILTER ================= */
    if (latitude && longitude && radius) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance",
          maxDistance: radius * 1000,
          spherical: true,
        },
      });
    }

    /* ================= BASE FILTER ================= */
    pipeline.push({
      $match: {
        propertyStatus: { $ne: "DELETE" },
      },
    });

    /* ================= SEARCH ================= */
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    /* ================= BASIC FILTERS ================= */
    if (city) pipeline.push({ $match: { city } });
    if (zone) pipeline.push({ $match: { zone } });
    if (type) pipeline.push({ $match: { type } });
    if (status) pipeline.push({ $match: { status } });
    if (verified !== undefined) pipeline.push({ $match: { verified } });
    if(propertyStatus) pipeline.push({ $match: { propertyStatus } });

    /* ================= BHK ================= */
    if (bhk) {
      pipeline.push({
        $match: {
          bhk: { $elemMatch: { bhk: Number(bhk) } },
        },
      });
    }

    /* ================= POSSESSION ================= */
    if (possessionDate) {
      pipeline.push({
        $match: {
          possessionDate: { $lte: new Date(possessionDate) },
        },
      });
    }

    /* ================= SPACE ================= */
    if (space && space.length) {
      pipeline.push({
        $match: { space: { $in: space } },
      });
    }

    /* ================= RERA ================= */
    if (reraRegistered === true) {
      pipeline.push({
        $match: { reraId: { $exists: true, $ne: "" } },
      });
    }

    /* ================= VIRTUAL TOUR ================= */
    if (virtualTourAvailable !== undefined) {
      pipeline.push({
        $match: { virtualTourAvailable },
      });
    }

    /* ================= PRICE ================= */
    if (minPrice || maxPrice) {
      pipeline.push({
        $match: {
          "price.total": {
            ...(minPrice && { $gte: minPrice }),
            ...(maxPrice && { $lte: maxPrice }),
          },
        },
      });
    }

    /* ================= TOKEN ================= */
    if (minToken || maxToken) {
      pipeline.push({
        $match: {
          tokenAmount: {
            ...(minToken && { $gte: minToken }),
            ...(maxToken && { $lte: maxToken }),
          },
        },
      });
    }

    /* ================= CREATED DATE ================= */
    if (fromDate || toDate) {
      pipeline.push({
        $match: {
          createdAt: {
            ...(fromDate && { $gte: new Date(fromDate) }),
            ...(toDate && {
              $lte: new Date(
                new Date(toDate).toISOString().slice(0, 10) +
                "T23:59:59.999Z"
              ),
            }),
          },
        },
      });
    }
    let agg = propertiesModel.aggregate(pipeline);
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 },
    };

    return await propertiesModel.aggregatePaginate(agg, options);
  },
};

module.exports = {
  propertiesServices,
};
