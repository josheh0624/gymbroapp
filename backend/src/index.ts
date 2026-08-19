import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pool from "./db/db";
import authRoutes from "./routes/auth";
import { exerciseRouter } from "./routes/exercise";
import { routineRouter } from "./routes/routines";
import { usersRouter } from "./routes/users";
import { workoutRouter } from "./routes/workouts";

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
app.use("/users", usersRouter);
app.use("/exercises", exerciseRouter);
app.use("/workouts", workoutRouter);
app.use("/routines", routineRouter);

app.get("/api/health", (req, res) => res.json({ ok: true, time: Date.now() }));

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
