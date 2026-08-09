import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pool from "./db/db";
import authRoutes from "./routes/auth";
import { exerciseRouter } from "./routes/exercise";

dotenv.config();

const app = express();

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:8081" ||
      "http://localhost:8082",
    credentials: true,
  }),
); //security access to allow cross-origin requests
app.use(express.json()); // use json data for the request body
pool.connect().then(() => console.log("connected"));

//ROUTES//
app.use("/auth", authRoutes);
app.use("/exercises", exerciseRouter);

///////////////////
//workout routes //

//create a workout

//update a workout

//delete a workout

///////////////////////////
//workout routine routes //

//create a routine

//update a routine

//delete a routine

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
