import { Schema, model } from "mongoose";

const addressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    address_type: { type: String }, 
    address: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    // landmark: { type: String },
    zipCode: { type: String },

    lat: { type: String },
    lang: { type: String },

    status: { type: String, default: "0" }
  },
  { timestamps: true }
);

const Address = model("Address", addressSchema, "addresses");
export default Address;
