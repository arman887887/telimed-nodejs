import { Schema, model } from 'mongoose';


const PollSchema =  Schema({
    adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  topic: {
    type: String,
    required: true,
  },
  invitees: {
    type: {
      allMembers: { type: String }, 
      AllOwners: { type: String },  
      AllTenants: { type: String }, 
    }, 
    required: true,
  },  
  file: {
    type: String, 
    required: false,
  },
  votes: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      vote: { type: String, required: true }, 
    }
  ],

}, 

{ timestamps: true }

);


 const Poll = model('Poll', PollSchema, 'polls');
 export default Poll;