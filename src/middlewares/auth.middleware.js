import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const tocken = req.cookies?.accessTocken || req.header("Authorization")?.replace("Bearer ",)

        if (!tocken) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedTocken = jwt.verify(tocken, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedTocken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid access tocken")
        }

        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access tocken")
    }
})