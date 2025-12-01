
import { Schema, model } from 'mongoose';

const MessageSchema = Schema({
  //  userId: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: false,
  // },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },

  message: {
    type: String,
    required: true,
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachment: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Message = model('Message', MessageSchema);


export { Message };




