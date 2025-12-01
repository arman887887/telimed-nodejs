
import Stripe from 'stripe';
import Subscription from '../../models/subscriptionModel.js';
import User from '../../models/userModel.js';
import { sendSuccess, sendError, replaceNullWithEmptyString } from '../../utills/sendResponse.js';
import mongoose from 'mongoose';
import Transaction from '../../models/transactionModel.js';
import nodemailer from 'nodemailer';

export const getTransaction = async (req, res) => {
    try {

        const transactions = await Transaction.aggregate([
            {
                $lookup: {
                    from: "user",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },

            {
                $unwind: "$user",

            },
            {
                $project: {
                    "user.password": 0
                },

            },
            { $sort: { _id: -1 } }
        ]);

        const response = transactions.map(Transaction => {
            const transactionObj = Transaction.toObject ? Transaction.toObject() : Transaction;
            return replaceNullWithEmptyString(transactionObj);
        });

        return sendSuccess(res, response, 'Transactions fetched successfully');
    } catch (error) {
        return sendError(res, error, 'Failed to fetch transactions');
    }
};

export const myTransaction = async (req, res) => {
    const id = req.params.id;
    try {
        const Id = new mongoose.Types.ObjectId(id);

        const transactions = await Transaction.aggregate([
            { $match: { userId: Id } },
            {
                $lookup: {
                    from: "user",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                },

            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    "user.password": 0
                }
            },
            { $sort: { _id: -1 } }
        ]);

        const response = transactions.map(transaction => {
            return replaceNullWithEmptyString(transaction);
        });

        return sendSuccess(res, response, 'transactions fetched successfully');
    } catch (error) {

        return sendError(res, error, 'Failed to fetch transactions');

    }
};

export const getSubscription = async (req, res) => {
    try {
        const subscriptions = await Subscription.aggregate([
            {
                $lookup: {
                    from: "user",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user",

            },
            {
                $project: {
                    "user.password": 0
                },

            },
            { $sort: { _id: -1 } }

        ]);

        const response = subscriptions.map(subscription => {
            const subscriptionObj = subscription.toObject ? subscription.toObject() : subscription;
            return replaceNullWithEmptyString(subscriptionObj);
        });

        return sendSuccess(res, response, 'subscriptions fetched successfully');
    } catch (sendError) {
        return sendError(res, error, 'Failed to fetch subscriptions');
    }
};

export const mySubscription = async (req, res) => {
    const id = req.params.id;
    try {

        const Id = new mongoose.Types.ObjectId(id);

        const subscriptions = await Subscription.aggregate([
            { $match: { userId: Id } },
            {
                $lookup: {
                    from: "user",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                },
            },
            {
                $unwind: "$user",

            },
            {
                $project: {
                    "user.password": 0
                }
            },
            { $sort: { _id: -1 } }
        ]);

        const response = subscriptions.map(subscription => {
            return replaceNullWithEmptyString(subscription);
        });

        return sendSuccess(res, response, 'subscription fetched successfully');
    } catch (error) {

        return sendError(res, error, 'Failed to fetch subscription');

    }
};

export const takeSubscription = async (req, res) => {
    const { userId, 
        amount, 
        expiryDate, 
        paymentMethodId, 
        packageType, 
        packageFeatures } = req.body;

    let session;
    let isReplicaSet = false;

    try {

        const serverStatus = await mongoose.connection.db.admin().serverStatus();
        isReplicaSet = serverStatus.repl || false;

        if (isReplicaSet) {
            session = await mongoose.startSession();
            session.startTransaction();
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            payment_method: paymentMethodId,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
        });

        const userDetails = await User.findById({userId});

        if (paymentIntent.status === 'succeeded') {
            let subscription = await Subscription.findOne({ userId }).session(session || null);
            let subscriptionId = 'SUB' + Math.floor(Math.random() * (9000 - 1000 + 1)) + 1000;

            if (subscription) {
                subscription.amount = amount;
                subscription.packageType = packageType;
                subscription.packageFeatures = packageFeatures;
                subscription.expiryDate = expiryDate;
                await subscription.save({ session });
            } else {

                subscription = await Subscription.create([{
                    userId,
                    subscriptionId,
                    packageType,
                    packageFeatures,
                    amount,
                    expiryDate,
                }], { session });
            }

        await Transaction.create([{
              subscriptionId: subscription.subscriptionId,
              packageType,
              userId,
              amount,
              paymentIntentId: paymentIntent.id,
              status: 'completed',
            }], { session });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            }
        });

        const logoUrl = process.env.LOGO_URL || 'https://projects.dotlinkertech.com/frontend/strata-management/homepage/assets/images/new-logo.png'; 
        const host = req.get('host');  
    
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: `Transaction Successfull`,
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; text-align: left; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${logoUrl}" alt="Logo" style="width: 300px; height: auto;" />
                        </div>
                        <p style="font-size: 14px;"><strong>Dear ${userDetails.firstName + userDetails.lastName},</strong></p>
                        <p style="font-size: 14px;">Your Transaction  of Amount <strong>${amount}</strong> has Been Successfull.</p>
                    
                    </div>
                `,
            };

            await transporter.sendMail(mailOptions);

            if (session) {
                await session.commitTransaction();
                session.endSession();
            }

            return res.status(200).json({
                success: true,
                message: 'Subscription completed successfully.',
                paymentIntent,
            });
        } else {
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            return res.status(400).json({
                success: false,
                message: 'Payment failed or requires further action.',
                paymentIntent,
            });

        }
    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }


        if (err.type === 'StripeCardError') {
            return res.status(400).json({
                success: false,
                message: err.message,
                error: 'Payment failed',
            });
        }


        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred.',
            error: 'Something went wrong',
        });
    }

};
 



