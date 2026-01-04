
import notificationModel from "../../../models/notification";


const notificationServices = {

    createNotification: async (insertObj) => {
        return await notificationModel.create(insertObj);
    },

    findNotification: async (query) => {
        return await notificationModel.findOne(query);
    },

    updateNotification: async (query, updateObj) => {
        return await notificationModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    multiUpdateNotification: async (query, updateObj) => {
        return await notificationModel.updateMany(query, updateObj, { multi: true });
    },

    notificationList: async (query) => {
        return await notificationModel.find(query).sort({ sendDate: 1 });
    },
    
    notificationListBlockedUserNameAggregate: async () => {
     let pipeline= [
      {
        $match: { notificationType: "UserName Blocked" }
    },
    {
        $sort: { createdAt: -1 }
    },
    {
        $group: {
            _id: '$userId',
            latestNotification: { $first: '$$ROOT' } 
        }
    }]
        return await notificationModel.aggregate(pipeline)
    },

    
    multiUpdateNotification: async (query, updateObj) => {
        return await notificationModel.updateMany(query, updateObj, { multi: true });
    },
   deleteAllNotification: async () => {
        return await notificationModel.deleteMany({});
    },

    paginateNotification: async (obj,specificDate) => {
       let {_id,page,limit,read,createdAt}=obj
       let aggregationPipeline = [
        {
          $match: {
            $and: [
              {
                $or: [
                  { userId: _id },
                  // { userId: { $exists: false } }
                ]
              },
              {
                $or: [
                  {
                    $and: [
                      { sendDate: { $lte: new Date() } },  
                      { sendDate: { $gt: createdAt } }  
                    ]
                  },
                  { sendDate: { $exists: false } }  
                ]
              },
              { status: { $ne: 'DELETE' } },
              { deleteFor: { $nin: [_id] } }
            ]
          }
        }
      ];
      
      if (read) {
        aggregationPipeline.push({
          $match: {
            read: { $nin: [_id] }
          }
        });
      }
     let data = notificationModel.aggregate(aggregationPipeline);
      
        let options = {
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          sort:{createdAt:-1}
        };
        return await notificationModel.aggregatePaginate(data, options);
      }
}

module.exports = { notificationServices };
