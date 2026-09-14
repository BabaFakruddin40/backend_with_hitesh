import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import  User  from "../models/user.model.js"; 
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken(userId);
        const refreshToken = user.generateRefreshToken(userId);
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
        
    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "Failed to generate tokens");
    }
};
const registerUser = asyncHandler(async (req, res) => {
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

const loginUser = asyncHandler(async (req, res) => {
    const { email, name, password } = req.body || {};
    
    // 2. Validate that at least one identifier and password exist
  if (!(email || name)) {
    throw new ApiError(400, "Username/name or email is required");
  }

  if (!password || typeof password !== "string" || password.trim() === "") {
    throw new ApiError(400, "Password is required");
  }

    const user = await User.findOne({ 
        $or: [
            { email: email },
            { name: email }  
        ]   
    });
    if (!user || !email || !name) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findByIdAndUpdate(user._id, 
        { refreshToken }, 
        { new: true })
        .select("-password -refreshToken");

    const options ={
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200, 
            { user: loggedInUser,accessToken, refreshToken }, 
            "User logged in successfully"
        )
    );
})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(req.user._id, 
        { 
            $set: { 
                refreshToken: undefined 
            } 
        },
        {
            new: true
        }
    );

    const options ={
        httpOnly: true,
        secure: true
    };
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
    return res.status(200).json(
        new ApiResponse(200, {}, "User logged out successfully")
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies.refreshToken || req.body.refreshToken ||  {};
    if (!refreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded?.id).select("-password -refreshToken");
        if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);
        user.refreshToken = newRefreshToken;
        await user.save();

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, 
                    { user, accessToken: newAccessToken, refreshToken: newRefreshToken }, 
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid refresh token");
    }
});

export { 
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken
};