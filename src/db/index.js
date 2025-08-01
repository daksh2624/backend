import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! Db host : ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDB connection has FAILED BRO: ", error);
        process.exit(1);   
    }
}

export default connectDB;