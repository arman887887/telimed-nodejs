import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;

const connectDB = async () => {
  
  try {

    await mongoose.connect(uri);  
    console.log('MongoDB connected successfully');
  
  }
   catch (error) {
    
    console.error('Error connecting to MongoDB:', error.message);
    // setTimeout(connectDB, 9000);

  }
};

export default connectDB;
