import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        //generate tokens
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //save the refresh token inside db
        user.refreshToken = refreshToken;
        await user.save( {validateBeforeSave : false} )

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generate access and refresh tokens")
    }
}

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

    // console.log(req.body);
    

    const {fullName, email, username, password} = req.body;

    if(
        [fullName, email, username, password].some((feild) => feild?.trim() === "")
    ){
        throw new ApiError(400, "Enter all the required details");
    }
    
    const existingUser = await User.findOne({
            $or: [{ username }, { email }]
    })

    if(existingUser){
        throw new ApiError(409, "User alredy Exists");
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    if(!avatarLocalPath){
        throw new  ApiError(400, "Avatar image is a required field");
    }
    
    let coverImageLocalPath;
    if(req.files && Array.isArray( req.files.coverImage ) && req.files?.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    

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

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    

    if(!createdUser){
        throw new ApiError(500, "Error while registering user")
    }

    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User has been registered succsessfully")
    )
} )

const loginUser = asyncHandler( async (req, res) => {
    //take the data from frontend - Done
    //check for required feilds - Done
    //check for username or email in db 
    //if exists check for password
    //if password is correct generate access and refresh token
    //send cookie
    //return res

    const {email, username, password} = req.body;

    if(!username && !email){
        throw new ApiError(400, "username or email is required");
    }

    if(!password){
        throw  new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        $or : [ { username } , { email } ]
    })

    if(!user){
        throw new ApiError(404, "User is not registered");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(404, "Enter correct password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken, refreshToken 
            },
            "User logged in succsessfully"
        )
    )

})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "Logged out Successfully")
    )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorised access")
    }

    try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                REFRESH_TOKEN_SECRET
            );
        
            const user = await User.findById(decodedToken?._id);
        
            if(!user){
                throw new ApiError(401, "Invalid refresh token")
            }
        
            if(use?.refreshToken !== incomingRefreshToken){
                throw new ApiError(401, "Refresh token hass either expired or used")
            }
        
            const options = {
                httpOnly: true,
                secure: true
            }
        
            const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(decodedToken._id);
        
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refrshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Token is not valid");
    }

})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 };
