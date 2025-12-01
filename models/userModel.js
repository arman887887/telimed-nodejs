import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },

    email: { type: String, required: true, unique: true },
    emailVerifiedAt: { type: String },

    password: { type: String, required: true },
    phone: { type: String },

    profile_picture: { type: String },

    role: { type: String, required: true },
    status: { type: String, default: "0" },
    isOnline: { type: String, default: "0" },

    addresses: [
      { type: Schema.Types.ObjectId, ref: "Address" }
    ]
  },
  { timestamps: true }
);

const User = model("User", userSchema, "users");
export default User;
