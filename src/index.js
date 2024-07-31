import dotenv from "dotenv"

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";

import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})



connectDB()









/*

*****first approch********

import express from "express"
const app = express()

    (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            app.on("error", (error) => {
                console.log("ERROR: ", error);
                throw error
            })

            app.listen(process.env.PORT, () => {
                console.log(`App is listining on port ${process.env.PORT}`);
            })

        } catch (error) {
            console.log("ERROR: ", error);
            throw error
        }
    })()

*/