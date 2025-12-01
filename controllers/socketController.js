
import { Group, Message, ChatFriend } from '../models/chatModel.js';
import { sendSuccess, sendError, replaceNullWithEmptyString } from '../utills/sendResponse.js';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

export const socketController = (io) => {

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
  
    // socket.on('joinGroup', ({ groupId, userId }) => {
    //   socket.join(groupId);
    //   console.log(`User ${userId} joined room ${groupId}`);
    // });
  
  
    
    socket.on('joinGroup', ({ joinedGroupId, groupId, userId }) => {
      
      if (Array.isArray(joinedGroupId) && joinedGroupId.length > 0) {
        
        joinedGroupId.forEach(group => {
          socket.join(group);
          console.log(`User ${userId} joined room ${group}`);
        });
      } else if (groupId) {
        
        socket.join(groupId);
        console.log(`User ${userId} joined room ${groupId}`);
    
      } else {    
        console.error('Invalid input: No valid group ID(s) provided.');
      }
    });
    

    socket.on('fetchGroups', async ({ adminId, userId }) => {
      if (!adminId || !userId) {
        socket.emit('groupData', { success: false, message: 'Missing adminId or userId' });
        return;
      }
    
      try {
        console.log('Finding groups for adminId:', adminId); 
    

        const groups = await Group.find({ adminId }).sort({ _id: -1 }).lean();
        console.log('Fetched groups:', groups); 
    
        const response = await Promise.all(groups.map(async (group) => {
          try {
            const host = socket.handshake.headers.host;
            if (!host) {
              throw new Error('Host is undefined');
            }
            console.log('Host:', host); 
    
            
            console.log(`Counting unread messages for group ${group._id} and user ${userId}`);
            const unreadCount = await Message.countDocuments({
              groupId: group._id,
              $nor: [{ readBy: userId }]
            });
            console.log(`Unread count for group ${group._id}:`, unreadCount);
    
            
            console.log(`Finding latest message for group ${group._id}`);
            const latestMessage = await Message.findOne({ groupId: group._id })
              .sort({ createdAt: -1 })
              .lean();
            console.log(`Latest message for group ${group._id}:`, latestMessage);
    
            
            group.groupLogoLink = group.groupLogo && group.groupLogo !== ''
              ? `http://${host}/public/uploads/groupLogo/${group.groupLogo}`
              : '';
            console.log(`Group logo link for group ${group._id}:`, group.groupLogoLink);
    
            return {
              ...replaceNullWithEmptyString(group),
              unreadCount,
              latestMessage: latestMessage ? replaceNullWithEmptyString(latestMessage) : null,
            };
          } catch (error) {
            console.error(`Error processing group ${group._id}:`, error);
            return {
              ...replaceNullWithEmptyString(group),
              unreadCount: 0,
              latestMessage: null
            };  
          }
        }));
    
        console.log('Response data:', response); 
    
       
        socket.emit('groupData', { success: true, data: response, message: 'Fetched successfully' });
      } catch (error) {
       
        console.error('Error fetching groups:', error);
        socket.emit('groupData', { success: false, message: 'Error fetching groups', error: error.message });
      }
    });
    
    socket.on('getChatHistory', async ({ adminId, userId, groupId }) => {
      try {
  
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
          return socket.emit('chatHistoryResponse', { success: false, message: 'Group not found' });
        }
    
  
        const host = socket.handshake.headers.host;
    
  
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
              isOnline: userDetails ? userDetails.isOnline : false,
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
    
        const cleanedMessages = messagesArray.map(chat => replaceNullWithEmptyString(chat));
    
        const response = {
          groupInfo: replaceNullWithEmptyString(groupInfo),
          messages: cleanedMessages,
        };
    
        return socket.emit('chatHistoryResponse', { success: true, data: response, message: 'Chat history fetched successfully' });
        
      } catch (error) {
        console.error('Error fetching chat history:', error);
        return socket.emit('chatHistoryResponse', { success: false, message: error.message });
      }
    });
    
    socket.on('sendMessage', async ({ groupId, userId, message, userName, profile_picture }) => {
      try {
    
        const newMessage = new Message({
          groupId,
          userId,
          message,
          readBy: [userId]
        });
        const savedMessage = await newMessage.save();

        io.to(groupId).emit('message', {
          groupId,
          userId,
          message,
          userName,
          profile_picture,
          readBy:[userId],
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    socket.on('joinIndividual', ({  senderId, receiverId }) => {
          const roomId = [senderId, receiverId].sort().join('-');  
          socket.join(roomId);
          console.log(`Users ${senderId} and ${receiverId} joined individual room ${roomId}`);
        });
     
     


    
    socket.on('sendIndividualMessage', async ({ senderId, receiverId, message }) => {
      const roomId = [senderId, receiverId].sort().join('-');  
      const newMessage = new Message({
        senderId,
        receiverId,
        message,
        readBy: [senderId]
      });
      const savedMessage = await newMessage.save();

      io.to(roomId).emit('messageIndividual', {
        senderId,
        receiverId,
        message,
        readBy:[senderId],
        createdAt: new Date(),
      });
    });


    socket.on('markAsRead', async ({ messageId, userId }) => {
      try {
    
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          {
            $addToSet: { readBy: userId } 
          },
          { new: true }
        );

        
        if (updatedMessage) {
          io.emit('messageReadUpdate', {
            messageId: updatedMessage._id,
            readBy: updatedMessage.readBy
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });


  });
};






