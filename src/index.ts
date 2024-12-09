import express from "express";
import bodyParser from "body-parser";
import db from "./utils/db";

import router from "./routes/api";

async function init() {
  try {
    const result = await db();

    console.log("database status", result);

    const app = express();

    app.use(bodyParser.json());

    const PORT = 3000;

    app.use("/api", router);

    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

init();
