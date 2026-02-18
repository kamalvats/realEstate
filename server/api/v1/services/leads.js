import leadsModel from "../../../models/leads";
import statuse, { ACTIVE } from "../../../enums/status";
import mongoose from "mongoose"
const leadsServices = {

    createLeads: async (insertObj) => {
        return await leadsModel.create(insertObj);
    },
    getLeads: async (obj) => {
        return await leadsModel.findOne(obj)
    },
    leadsCount: async (obj) => {
        return await leadsModel.countDocuments(obj);
    },
    updateLeads: async (query, updateObj) => {
        return await leadsModel.findOneAndUpdate(query, updateObj, { new: true, upsert: true });
    },
    findLeadss: async (query) => {
        return await leadsModel.find(query);
    },
    findLeadssSort: async (query) => {
        return await leadsModel.find(query).sort({ airdropAmount: -1 });
    },

    leadsAggSearch: async (validatedBody) => {
        const {
            search,
            fromDate,
            toDate,
            page,
            limit,
            type,
            status,
            startDate,
            endDate,
            selfQuery,
            leadsStatus,
            assignedTo,
            source,
            propertyId,
            userId,
            leadsType

        } = validatedBody;


        let query = [
            {
                $match: {
                    status: { $ne: "Delete" },
                },
            },
            {
                $lookup: {
                    from: "properties",
                    localField: "propertyId",
                    foreignField: "_id",
                    as: "propertyData",
                },
            },
            {
                $unwind: {
                    path: "$propertyData",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "user",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData",
                },
            }, {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true,
                },
            }
        ];
        if (selfQuery) {
            query.push(selfQuery)
        }
        if (type) {
            query.push({ $match: { type: type } });
        }
        if (source) {
            query.push({ $match: { source } });
        }

        if (userId) {
            query.push({
                $match: {
                    userId: mongoose.Types.ObjectId(userId)
                }
            });
        }


        if (search) {
            query.push({
                $match: {
                    name: { $regex: search, $options: "i" },
                },
            });
        }

        if (propertyId) {
            query.push({
                $match: {
                    propertyId: propertyId,
                },
            });
        }


        if (assignedTo) {
            query.push({
                $match: {
                    assignedTo: { $in: assignedTo }
                }
            });

        }




        if (leadsType) {
            query.push({
                $match: {
                    leadsType: leadsType
                }
            });
        }

        if (search) {
            query.push({
                $match: {
                    name: { $regex: search, $options: 'i' }
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
        if (leadsStatus) {
            query.push({
                $match: {
                    leadsStatus: leadsStatus
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

        if (startDate && endDate) {
            query.push({
                $match: {
                    $and: [
                        {
                            startDate: {
                                $gte: new Date(new Date(startDate).toISOString().slice(0, 10))
                            }
                        },
                        {
                            endDate: {
                                $lte: new Date(new Date(endDate).toISOString().slice(0, 10) + "T23:59:59.999Z")
                            }
                        }
                    ]
                }
            });
        }
        let agg = leadsModel.aggregate(query);
        let options = {
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            sort: { createdAt: -1 },
        };

        return await leadsModel.aggregatePaginate(agg, options);
    },
    leadsAggCount: async (validatedBody) => {

  const pipeline = [

    /* ================= FILTER ================= */
    {
      $match: {
        userId: new mongoose.Types.ObjectId(validatedBody.userId),
        type: "info",
        status: { $ne: "cancel" }
      }
    },

    /* ================= POPULATE PROPERTY ================= */
    {
      $lookup: {
        from: "properties",
        localField: "propertyId",
        foreignField: "_id",
        as: "property"
      }
    },
    { $unwind: "$property" },

    /* ================= GROUP BY ZONE ================= */
    {
      $group: {
        _id: "$property.zone",
        totalCount: { $sum: 1 }
      }
    },

    /* ================= SORT ================= */
    { $sort: { totalCount: -1 } },

    /* ================= TOP 2 + OTHERS ================= */
    {
      $facet: {
        topZones: [{ $limit: 2 }],
        others: [
          { $skip: 2 },
          {
            $group: {
              _id: "others",
              totalCount: { $sum: "$totalCount" }
            }
          }
        ]
      }
    },

    /* ================= FORMAT OUTPUT ================= */
    {
      $project: {
        result: {
          $concatArrays: [
            [
              {
                label: "1st",
                zone: { $arrayElemAt: ["$topZones._id", 0] },
                totalCount: { $arrayElemAt: ["$topZones.totalCount", 0] }
              },
              {
                label: "2nd",
                zone: { $arrayElemAt: ["$topZones._id", 1] },
                totalCount: { $arrayElemAt: ["$topZones.totalCount", 1] }
              }
            ],
            "$others"
          ]
        }
      }
    },
    { $unwind: "$result" },
    { $replaceRoot: { newRoot: "$result" } }
  ];

  return await leadsModel.aggregate(pipeline);
}

};

module.exports = {
    leadsServices,
};
