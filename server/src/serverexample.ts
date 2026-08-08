import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import productsRouter from "./src/routes/products";

const app = express(); // makes express server

// security origin
app.use(
  cors({
    origin: ["http://localhost:8081", "http://127.0.0.1:8081"],
  }),
);

// middleware
// typical request response flow
// front end - fetch('path')
// request v
// backend
// middleware - app.use(myMiddleware)
// express routes - app.get('path', myHandler)
// response
// back to front end - response.data

// common use for logging requests / auth + perms / validating data before route handler / file uploads / error handling
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(req.method, req.path);
  next();
});

// post route steps
app.use(express.json()); // 1. enable JSON body parsing (parse json data and put it in req.body)

app.use("/products", productsRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("hello from express");
});

// GET route
app.get("/about", (req: Request, res: Response) => {
  res.send("about page");
});

// connecting to a frontend
app.get("/message", (req: Request, res: Response) => {
  res.json({ message: "hello from backend" });
});

// define the shape of the expected request body
interface MessageBody {
  name: string;
  message: string;
}

// POST BACKEND
app.post("/message", (req: Request<{}, {}, MessageBody>, res: Response) => {
  const { name, message } = req.body; // parse name and message from the req body

  // (usually store data in database here)
  console.log("new message:", name, message); // console.log to show u received data
  res.json({ message: "thank you for your message cuh" }); // send response to front end
});

// route - visit specific url, get specific response.
// in express, use app.get() or app.post()
app.listen(3000, () => {
  // makes server on port 3000
  console.log("server running");
});
