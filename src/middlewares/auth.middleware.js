import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

//import .env


export const verifyJWT = asyncHandler( async (req , _, next) => {
    try {
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
            
            if (!token) {
                throw new ApiError(404, "Unauthorised request")
            }
        
            const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
            const user = await User.findById(decode._id).select("-password -refreshToken");
        
            if(!user){
                throw new ApiError(404, "Invalid Access token")
            }
        
            req.user = user;
            next();
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong with verifying the token")
    }

})