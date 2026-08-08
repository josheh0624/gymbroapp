import Router, { Request, Response } from "express";
import client from "../db/db";

const router = Router();

////////////////////
//exercise routes //

router.get("/", (req: Request, res: Response) => {
  res.send("hello from excercise route");
});

//create exercise

router.post("/create", (req: Request, res: Response) => {
  const { id, name, hit_area } = req.body;

  const insert_query =
    "INSERT INTO exercises (id, name, hit_area) VALUES ($1,$2,$3)";

  client.query(insert_query, [id, name, hit_area], (err, result) => {
    if (err) {
      console.log("error");
      res.send(err);
    } else {
      console.log(result);
      res.send("posted data");
    }
  });
});

//get all exercises

router.get("/getAll", (req: Request, res: Response) => {
  const fetch_query = "SELECT * FROM exercises";

  client.query(fetch_query, (err, result) => {
    if (err) {
      console.log("error");
      res.send(err);
    } else {
      console.log("fetched data");
      res.send(result.rows);
    }
  });
});

//get a exercise by id

router.get("/fetchExercise/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const fetch_query = "SELECT * FROM exercises WHERE id = $1";

  client.query(fetch_query, [id], (err, result) => {
    if (err) {
      console.log("error");
      res.send(err);
    } else {
      console.log("fetched data");
      res.send(result.rows);
    }
  });
});

//update exercise data

router.put("/updateExercise/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const name = req.body.name;
  const hit_area = req.body.hit_area;

  const update_query = "UPDATE exercises SET name=$2, hit_area=$3 WHERE id=$1";

  client.query(update_query, [id, name, hit_area], (err, result) => {
    if (err) {
      console.log("error");
      res.send(err);
    } else {
      console.log("updated data");
      res.send(result);
    }
  });
});

// delete exercise

router.delete("/deleteExercise/:id", (req: Request, res: Response) => {
  const id = req.params.id;

  const delete_query = "DELETE FROM exercises WHERE id=$1";

  client.query(delete_query, [id], (err, result) => {
    if (err) {
      console.log("error");
      res.send(err);
    } else {
      console.log("deleted data");
      res.send(result);
    }
  });
});

export default router;
export { router as exerciseRouter };
