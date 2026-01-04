import kycModel from "../../../models/kycRequests";
import statuse, { ACTIVE } from "../../../enums/status";
import mongoose from "mongoose"
const kycServices = {

    createKyc: async (insertObj) => {
        return await kycModel.create(insertObj);
    },
    getKyc: async (obj) => {
        return await kycModel.findOne(obj)
    },
    kycCount: async (obj) => {
        return await kycModel.countDocuments(obj);
    },
    updateKyc: async (query, updateObj) => {
        return await kycModel.findOneAndUpdate(query, updateObj, { new: true, upsert: true });
    },
    findKycs: async (query) => {
        return await kycModel.find(query);
    },
    findKycsSort: async (query) => {
        return await kycModel.find(query).sort({ airdropAmount: -1 });
    },

    kycAggSearch: async (validatedBody) => {
        const {
            search,
            fromDate,
            toDate,
            page,
            limit,
            status,
            referenceId,
            pan,
            name,
            userId
        } = validatedBody;


        let query = [
            {
                $match: {
                    status: { $ne: "Delete" },
                },

            }, {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                }
            }, {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];


        if (search) {
            query.push({
                $match: {
                    name: { $regex: search, $options: "i" },
                    pan: { $regex: search, $options: "i" },
                },
            });
        }

        if (status) {
            query.push({
                $match: {
                    status: status
                }
            });
        }

        if (userId) {
            query.push({
                $match: {
                    userId: new mongoose.Types.ObjectId(userId)
                }
            });
        }

        if (referenceId) {
            query.push({
                $match: {
                    referenceId: referenceId
                }
            });
        }

        if (pan) {
            query.push({
                $match: {
                    pan: pan
                }
            });
        }

        if (name) {
            query.push({
                $match: {
                    name: name
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

        let agg = kycModel.aggregate(query);
        let options = {
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            sort: { createdAt: -1 },
        };

        return await kycModel.aggregatePaginate(agg, options);
    },
};

module.exports = {
    kycServices,
};
