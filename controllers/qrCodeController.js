import QRCode from 'qrcode';
import QrCode from '../models/qrCodeModel.js';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../utills/sendResponse.js';
import User from '../models/userModel.js';

export const getQrCodes = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return sendError(res, null, 'Invalid adminId format');
    }

    
    const user = await User.findById(adminId);
    if (!user) {
      return sendError(res, null, 'Admin not found');
    }

    const qrData = `https://strata.dotlinkertech.com/member-register=${adminId}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);

    
    let qrcode = await QrCode.findOne({ adminId });

    
    if (!qrcode) {
      qrcode = await QrCode.create({
        adminId: adminId,
        qrCode: qrCodeImage,
      });
    }

    // Return the QR code in response
    const response = {
      ...qrcode.toObject(),
      qrCodeImage: qrcode.qrCode
    };

    return sendSuccess(res, response, 'QR Code fetched successfully');

  } catch (error) {
    console.error('Error fetching QR code:', error);
    return sendError(res, null, 'Something went wrong');
  }
};
