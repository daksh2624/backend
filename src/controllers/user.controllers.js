import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
    // Take data from the frontend
    // check for requied  fields
    // check if user alredy exists
    // check for avatar upload
    // upload avatar image on cloudinary
    // create user object
    // remove password and refresh token feild from response
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body;
    console.log("Email: ", email);

    if(
        [fullName, email, username, password].some((feild) => feild?.trim() === "")
    ){
        throw new ApiError(400, "FullName is a required field");
    }

    const existingUser = User.findOne({
            $or: [{ username }, { email }]
    })

    if(existingUser){
        throw new ApiError(409, "User alredy Exists");
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new  ApiError(400, "Avatar image is a required field");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new  ApiError(400, "Avatar image is a required field");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await user.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500, "Error while registering user")
    }

    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User has been registered succsessfully")
    )
} )

export { registerUser };