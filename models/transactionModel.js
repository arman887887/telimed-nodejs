
import { Schema, model } from 'mongoose';

const transactionSchema = Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: String },
    amount: { type: Number, required: true },
    paymentIntentId: { type: String },
    status: { type: String }
},
    { timestamps: true }
);

const Transaction = model('Transaction', transactionSchema, 'transaction');

export default Transaction


