import { Schema, model } from 'mongoose';

const qrcodeSchema = new Schema({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  qrCode: { type: String, required: true }  
},
{ timestamps: true }
);

const QrCode = model('QrCode', qrcodeSchema, 'qrcode');

export default QrCode;
