import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessTocken = user.generateAccessTocken()
        const refreshTocken = user.generateRefreshTocken()

        user.refreshTocken = refreshTocken
        await user.save({ validateBeforeSave: false })

        return { accessTocken, refreshTocken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tocken")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body
    // console.log("email: ", email);

    // if (fullname === "") {
    //     throw new ApiError(400, "Full name is required")
    // }

    if (
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email/username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshTocken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!!")
    )

})

const loginUser = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body

    if (!username || !email) {
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Inavlid user credentials")
    }

    const { accessTocken, refreshTocken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshTocken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessTocken", accessTocken, options).cookie("refreshTocken", refreshTocken, options).json(
        new ApiResponse(200, {
            user: loggedInUser, accessTocken, refreshTocken
        },
            "User logged In Sucessfully"
        )
    )

})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshTocken: undefined
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

    return res.status(200).clearCookie("accessTocken", options).clearCookie("refreshTocken", options).json(new ApiResponse(200, {}, "User logged out"))
})


export {
    registerUser,
    loginUser,
    logoutUser
}