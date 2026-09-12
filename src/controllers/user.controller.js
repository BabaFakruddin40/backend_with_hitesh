import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"; 
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res, _next) => {
  //get the user details 
  const { fullName, name, email, password } = req.body;
  console.log(`fullName: ${fullName}, name: ${name}, email: ${email}, password: ${password}`);
  console.log(req.body);
  //validate the user details

  if (
    [fullName,name,email,password].some((field) => field.trim() === "")
)
 {
    throw new ApiError(400, "All fields are required");
}

  const existingUser = await User.findOne({
    $or: [
      { fullName },
      { name },
      { email },
      { password },
    ],
  });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    // Handle avatar upload logic here
    throw new ApiError(400, "Avatar is required");
  }
   
  let coverImage = "";
  if (coverImageLocalPath) {
  const uploadedCover = await uploadOnCloudinary(coverImageLocalPath);
  coverImage = uploadedCover?.url || "";
}

//   if (coverImageLocalPath) {
//     // Handle cover image upload logic here
//     throw new ApiError(400, "Cover image is required");
//   }

  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
//   const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

  if(!avatarUrl){
    throw new ApiError(400, "Failed to upload avatar");
  }
  if(!coverImage){
    throw new ApiError(400, "Failed to upload cover image");
  }

  const user=await User.create(
    {
      fullName,
      name: name.toLowerCase(),
      email,
      password,
      avatar: avatarUrl.url,
      coverImage: coverImage || "",
    }
  );

  const savedUser = await User.findById(user._id).select(
    "-password -refreshToken"
);

if(!savedUser)
    {
      throw new ApiError(500, "Failed to save user to the database during registration");

    }

  return res.status(201).json(
    new ApiResponse(200, savedUser, "User registered successfully")
  );
});

export { registerUser };