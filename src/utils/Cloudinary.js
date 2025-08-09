import { v2 as cloudinary} from "cloudinary";
import fs from "fs";
import dotenv from "dotenv"

dotenv.config({ path: '/.env' })


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET
})

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if(!localfilepath) return null;

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        });//
        console.log("File has been uploaded succesfully!! ", response.url);
        return response;
    } catch (error) {
        fs.unlink(localfilepath); //remove the locally save temp file as the upload operation failed
        return null;
    }
}

export { uploadOnCloudinary };