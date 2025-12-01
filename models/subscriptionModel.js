
import { Schema, model } from 'mongoose';

const subscriptionSchema = Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId:{type:String},
    amount: { type: Number, required: true },
    startDate: { type: String, required: true },
    expiryDate: { type: String, required: true }

},
    { timestamps: true }
);

const Subscription = model('Subscription', subscriptionSchema, 'subscription');

export default Subscription