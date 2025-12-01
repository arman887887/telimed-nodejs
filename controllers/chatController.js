import { Group, Message, ChatFriend } from '../models/chatModel.js';
import { sendSuccess, sendError, replaceNullWithEmptyString } from '../utills/sendResponse.js';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

export const Groups = async (req, res) => {
  try {
    const {adminId, userId } = req.params; 
    const groups = await Group.find({ adminId }).sort({ _id: -1 }).lean(); 

    const response = await Promise.all(groups.map(async (group) => {
      const host = req.get('host');

   
      const unreadCount = await Message.countDocuments({
        groupId: group._id,
        $nor: [{ readBy: userId }] 
      });

     
      const latestMessage = await Message.findOne({ groupId: group._id })
        .sort({ createdAt: -1 })
        .lean();

      
      group.groupLogoLink = group.groupLogo && group.groupLogo !== ''
        ? `http://${host}/public/uploads/groupLogo/${group.groupLogo}`
        : '';

      return {
        ...replaceNullWithEmptyString(group),
        unreadCount,
        latestMessage: unreadCount > 0 ? replaceNullWithEmptyString(latestMessage) : null 
      };
    }));

    return sendSuccess(res, response, 'Fetched successfully'); 
    
  } catch (error) {
    return sendError(res, error, 'Error fetching'); 
  }
};

export const searchGroups = async (req, res) => {
  try {
    const { adminId, groupName } = req.params;

    const groups = await Group.find({ adminId, groupName }).sort({ _id: -1 }).lean();


    const response = groups.map((group) => {
      const host = req.get('host');

      group.groupLogoLink = group.groupLogo && group.groupLogo !== ''
        ? `http://${host}/public/uploads/groupLogo/${group.groupLogo}`
        : '';

      return replaceNullWithEmptyString(group);
    });
   
    if (response.length === 0) {
      return sendSuccess(res, '', 'Chat Not Found');
    }  

    return sendSuccess(res, response, '');
  }

   catch (error) {
    return sendError(res, error, 'Error fetching chat history');
  }
};

export const createGroup = async (req, res) => {
  try {
    const { adminId, groupName, group_ownerId } = req.body;

    const groupLogo = req.file ? req.file.filename : ''
    const newGroup = new Group({
      adminId,
      group_ownerId,
      groupName,
      groupLogo,
      members: group_ownerId
    });
    const savedGroup = await newGroup.save();
    return sendSuccess(res, savedGroup, 'Group created successfully');
  } catch (error) {
    return sendError(res, error, 'Error creating group');
  }
};

export const findGroup = async (req, res) => {

  const { id } = req.params;

  try {

    const group = await Group.findById(id).lean();

    const host = req.get('host');
    group.groupLogoLink = group.groupLogo && group.groupLogo != ''
      ? `http://${host}/public/uploads/groupLogo/${group.groupLogo}`
      : '';

    if (!group) {
      return sendError(res, '', 'Group Not Found');
    }

    return sendSuccess(res, group, 'Group Find Successfully');


  } catch (error) {

    return sendError(res, error, 'something went wrong');
  }
}

export const getChatHistory = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    
    const messages = await Message.find({ groupId });

    
    const unreadMessages = messages.filter(message => !message.readBy.includes(userId));
    
    
    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(msg => msg._id) } },
        { $addToSet: { readBy: userId } }
      );
    }

    
    const groupData = await Group.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(groupId) } },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'groupId',
          as: 'messages',
        },
      },
    ]);

    if (!groupData.length) {
      return sendError(res, '', 'Group not found');
    }

    const host = req.get('host');

    
    const groupInfo = {
      _id: groupData[0]._id,
      group_ownerId: groupData[0].group_ownerId,
      adminId: groupData[0].adminId,
      
      groupName: groupData[0].groupName,
      groupLogoLink: groupData[0].groupLogo
        ? `http://${host}/public/uploads/groupLogo/${groupData[0].groupLogo}`
        : '',
      members: groupData[0].members,
      createdAt: groupData[0].createdAt,
    };

    
    const messagesArray = await Promise.all(
      groupData[0].messages.map(async (message) => {
        const userDetails = await User.findById(message.userId);
        return {
          _id: message._id,
          userId: message.userId,
          isOnline:userDetails.isOnline,
          userName: userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : 'Unknown User',
          profile_picture: userDetails?.profile_picture
            ? `http://${host}/public/uploads/profile/${userDetails.profile_picture}`
            : '',
          message: message.message,
          groupId: message.groupId,
          createdAt: message.createdAt,
        };
      })
    );

    
    replaceNullWithEmptyString(groupInfo);
    const cleanedMessages = messagesArray.map(chat => replaceNullWithEmptyString(chat));

    const response = {
      groupInfo,
      messages: cleanedMessages,
    };

    return sendSuccess(res, response, 'Chat history fetched successfully');

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return sendError(res, error.message, 'Error fetching chat history');
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { groupName } = req.body;

    console.log('Updating group with ID:', groupId);


    const oldGroup = await Group.findById(groupId);

    if (!oldGroup) {
      console.log('Group not found');
      return sendError(res, null, 'Group not found');
    }


    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      {
        groupName: groupName || oldGroup.groupName,
        groupLogo: req.file ? req.file.filename : oldGroup.groupLogo
      },
      { new: true }
    );

    if (updatedGroup) {
      console.log('Group updated:', updatedGroup);
      return sendSuccess(res, '', 'Group Updated Successfully');
    } else {
      console.log('Error: group not updated');
      return sendError(res, null, 'Error updating group');
    }
  } catch (error) {
    console.error('Error in updateGroup:', error);
    return sendError(res, error, 'Error Updating Group');
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params

    const group = await Group.findByIdAndDelete(groupId);

    if (group) {

      return sendSuccess(res, '','Group Deleted Successfully');

    }
  } catch (error) {

    return sendError(res, error, 'Error Deleting Group');
  }
}

export const joinGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);

    if (!group) {
      return sendError(res, '', 'Groupnot found');
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    return sendSuccess(res, group, 'Joined group successfully');
  } catch (error) {
    return sendError(res, error, 'Error joining group');
  }
};

export const leaveGroup = async (req, res) => {
    try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);

    if (!group) {
      return sendError(res, '', 'Group not found');
    }

    if (group.members.includes(userId)) {
      group.members.pull(userId);
      await group.save();
    }

    return sendSuccess(res, group, 'group Leave successfully');

  } catch (error) {
    return sendError(res, error, 'Error leaving group');
  }
};                                                                                                                                                   

export const sendMessage = async (req, res) => {
  try {
    const { groupId, userId, message } = req.body;
    const newMessage = new Message({
      groupId,
      userId,
      message,
      readBy: [userId]
    });
    const savedMessage = await newMessage.save();
    return sendSuccess(res, savedMessage, 'Message sent successfully');
  } catch (error) {
    return sendError(res, error, 'Error sending message');
  }
};

export const findFriendChats = async (req, res) => {
  const { senderId, receiverId } = req.params;

  const chatExists = await Message.findOne({
    $or: [
      { senderId: new mongoose.Types.ObjectId(senderId), receiverId: new mongoose.Types.ObjectId(receiverId) },
      { senderId: new mongoose.Types.ObjectId(receiverId), receiverId: new mongoose.Types.ObjectId(senderId) }
    ]
  });

  const host = req.get('host');

  const userDetails = await User.findById(receiverId).select('firstName lastName role email profile_picture isOnline');
  if (!userDetails) {
    return res.status(404).json({ message: 'Friend not found' });
  }

  userDetails.profile_picture = userDetails.profile_picture
    ? `http://${host}/public/uploads/profile/${userDetails.profile_picture}`
    : '';

  if (!chatExists) {
    return sendSuccess(res, { userDetails, messages: [] }, 'No chat history found');
  }

  const getChats = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(senderId), receiverId: new mongoose.Types.ObjectId(receiverId) },
          { senderId: new mongoose.Types.ObjectId(receiverId), receiverId: new mongoose.Types.ObjectId(senderId) }
        ]
      }
    },
  ]);

  if (!getChats.length) {
    return res.status(404).json({ message: 'No chat history found' });
  }

  
  const updatePromises = getChats.map(async (chat) => {
    if (!chat.readBy.includes(receiverId)) {
      chat.readBy.push(receiverId); 

      
      await Message.updateOne({ _id: chat._id }, { $set: { readBy: chat.readBy } });
    }
  });

  await Promise.all(updatePromises);

  const messages = getChats.map((chat) => ({
    _id: chat._id,
    message: chat.message,
    senderId: chat.senderId,
    createdAt: chat.createdAt,
  }));

  return sendSuccess(res, { userDetails, messages }, '');
};

export const getAllusers = async (req, res) => {
  const adminId = req.params.adminId;
  const userId = req.params.userId;

  const adminObjectId = new mongoose.Types.ObjectId(adminId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // if (!mongoose.Types.ObjectId.isValid(adminObjectId)) {
  //   return sendError(res, '', 'Invalid adminId format');
  // }

  // try {
   
  //   const members = await Member.aggregate([
  //     { $match: { adminId: adminObjectId } },
  //     {
  //       $lookup: {
  //         from: "user",
  //         localField: "userId",
  //         foreignField: "_id",
  //         as: "user"
  //       }
  //     },
  //     { $unwind: "$user" },
  //     { $project: { "user.password": 0 } },
  //     { $sort: { _id: -1 } }
  //   ]);

    

  //   const host = req.get('host');

 
  //   const membersResponse = await Promise.all(members.map(async member => {
  //     const unreadCount = await Message.countDocuments({
  //       receiverId:userObjectId,
  //       $nor: [{ readBy: userObjectId }]
  //     });

     
  //     const latestMessage = await Message.findOne({
  //       receiverId:userObjectId,
  //       $nor: [{ readBy: userObjectId }]
  //     }).sort({ createdAt: -1 }); 

  //     const memberObj = {
  //       ...member,
  //       profileLink: member.user.profile_picture ? 
  //         `http://${host}/public/uploads/profile/${member.user.profile_picture}` : '',
  //       unreadCount,
  //       latestMessage: unreadCount>0 ? {
  //         message: latestMessage.message,
  //         createdAt: latestMessage.createdAt,
  //         isOnline: member.user.isOnline

  //       } : null 
  //     };

  //     return replaceNullWithEmptyString(memberObj);
  //   }));

    
  //   const adminResponse = await Promise.all(admin.map(async adminObj => {
  //     const unreadCount = await Message.countDocuments({
  //       receiverId: userObjectId,
  //       $nor: [{ readBy: userObjectId }]
  //     });

      
  //     const latestMessage = await Message.findOne({
  //       receiverId: userObjectId,
  //       $nor: [{ readBy: userObjectId }]
  //     }).sort({ createdAt: -1 }); 

  //     adminObj.profileLink = adminObj.user.profile_picture ? 
  //       `http://${host}/public/uploads/profile/${adminObj.user.profile_picture}` : '';

  //     return {
  //       ...replaceNullWithEmptyString(adminObj),
  //       unreadCount,
  //       latestMessage: unreadCount>0 ? {
  //         message: latestMessage.message,
  //         createdAt: latestMessage.createdAt,
  //         isOnline: adminObj.user.isOnline
  //       } : null 
  //     };
  //   }));


  //   const combinedUsers = [...adminResponse, ...membersResponse];

  //   const response = {
  //     users: combinedUsers,
  //   };

  //   return sendSuccess(res, response, 'Admin and members fetched successfully');
  // } catch (error) {
  //   return sendError(res, error, 'Failed to fetch admin and members');
  // }
};

export const sendIndividualMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
      readBy:[senderId]
    });

    const savedMessage = await newMessage.save();

    return sendSuccess(res, savedMessage, 'Message sent successfully');
  }
  catch (error) {

    return sendError(res, error, 'Error sending message');
  }
}; 

    