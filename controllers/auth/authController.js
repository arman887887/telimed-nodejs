import QrCode from '../../models/qrCodeModel.js';
import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import User from '../../models/userModel.js';
import { sendSuccess, Unauthorized, sendError, replaceNullWithEmptyString } from '../../utills/sendResponse.js';
import { addvalidMember } from '../../valiidator/member/memberValidator.js'
import Address from '../../models/addressModel.js';
dotenv.config();

const loginValidationMiddleware = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
];

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      addresses 
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, "", "Email already taken");

    const hashedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PASS_SEC
    ).toString();

    const profile_picture = req.file ? req.file.filename : "";

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      profile_picture,
      role
    });

    let savedAddresses = [];

    if (Array.isArray(addresses) && addresses.length > 0) {
      for (const add of addresses) {
        const newAddress = await Address.create({
          ...add,
          userId: user._id
        });
        savedAddresses.push(newAddress._id);
      }
    }

    user.addresses = savedAddresses;
    await user.save();

    const response = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
    };

    return sendSuccess(res, response, "Successfully Registered");

  } catch (err) {
    console.error(err);
    return sendError(res, err, "Something Went Wrong");
  }
};

export const login = async (req, res) => {

    await Promise.all(loginValidationMiddleware.map(validation => validation.run(req)));
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Wrong Credentials' });
        }

        const decryptedPassword = CryptoJS.AES.decrypt(user.password, process.env.PASS_SEC).toString(CryptoJS.enc.Utf8);

        if (decryptedPassword !== password) {
            return res.status(401).json({ error: 'Wrong Credentials' });                
        }

        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const updateUser = await User.findOneAndUpdate(
            { email },
            { isOnline: 1 },
            { new: true }
        );
        

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development',
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000,
        });

    
        const response = {
            id: user._id,
            role: user.role,
            email: user.email,
            accessToken,
        };
        return sendSuccess(res, response, 'Successfully Logged In');

    } catch (err) {
        return sendError(res, err, 'Something Went Wrong');
    }
};

export const currentUser = async (req, res) => {
    try {
        
        const user = req.user;
        const foundUser = await User.findById(user.id);
        
        if (!foundUser) {
            return res.status(404).json({ error: "User Not Found" });
        }

        const host = req.get('host');
        const userData = await User.aggregate([
            {
                $match: { _id: foundUser._id },
            },
            {
                $lookup: {
                    from: 'addresses',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'address'
                }
            }
        ]);
        
        
        const response = userData.map(user => {
            const userObj = user;
         
            if (userObj.password) {
                delete userObj.password;
            }
           
            userObj.profileLink = userObj.profile_picture && userObj.profile_picture != '' ? `http://${host}/public/uploads/profile/${userObj.profile_picture}` : '';


            return replaceNullWithEmptyString(userObj);
        });

        return sendSuccess(res, response, 'User data retrieved successfully');
    } catch (err) {
        return sendError(res, err, 'Something Went Wrong');
    }
};

export const verifyEmail = async (req, res) => {

    try {
        const { email, token } = req.query;

        if (!email || !token) {
            return res.status(400).send(`
                <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                    <h1>Verification Failed</h1>
                    <p>Email and token are required to verify your account.</p>
                </div>
            `);
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).send(`<div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                    <h1>Verification Failed</h1>
                    <p>Invalid or expired token. Please request a new verification link.</p>
                </div>`);
        }


        const user = await User.findOneAndUpdate(
            { email },
            { emailVerifiedAt: new Date() },
            { new: true }
        );

        const id= user._id;

        if (user) {
            return res.status(200).send(`
                <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                    <h1>Verification Successful</h1>
                    <p>Your email has been successfully verified. You can now <a href="https://strata.dotlinkertech.com/complete-registration?i=${id}">Continue</a>.</p>
                </div>
            `);
        } else {
            return res.status(404).send(`
                <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                    <h1>Verification Failed</h1>
                    <p>We could not find a user with the provided email.</p>
                </div>
            `);
        }
    
    }catch (error) {

        console.error('Error verifying email:', error);
        return res.status(500).send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h1>Something Went Wrong</h1>
                <p>An error occurred while verifying your email. Please try again later.</p>
            </div>
        `);
    }
};

export const logout = async (req, res) => {
    try {

        res.cookie('accessToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development',
            sameSite: 'Strict',
            expires: new Date(0),
        });


        const { id } = req.user

        const updateUser = await User.findByIdAndUpdate(
             id ,
            { isOnline: 0 },
            { new: true }
        );


        return sendSuccess(res, '', 'Successfully Logged Out');
    } catch (err) {

        return sendError(res, err, 'Something Went Wrong');
    }
};

