import { uploadOnCloudinary } from "../Utils/cloudinary.js";

//======================================upload image===========================================================//
export const uploadImage = async (request, response) => {
    if (!request.file) {
        return response.status(404).json("File not found");
    }

    const imageUrl = request.file.path;
    const cloudinaryUrl = await uploadOnCloudinary(imageUrl);

    if (!cloudinaryUrl) {
        return response.status(400).json({ msg: "Image upload failed" });
    }

    response.status(200).json(cloudinaryUrl);
};