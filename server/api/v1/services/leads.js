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
            leadsType,
            status,
            startDate,
            endDate,
            selfQuery,
            leadsStatus,
            assignedTo,
            source,
            propertyId,
            userId

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
            },{
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true,
                },
            }
        ];
        if (selfQuery) {
            query.push(selfQuery)
        }
        if (leadsType) {
            query.push({ $match: { type: leadsType } });
        }
        if (source) {
            query.push({ $match: { source } });
        }

        if(userId){
            query.push({
                $match: {
                    userId: userId
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
};

module.exports = {
    leadsServices,
};
