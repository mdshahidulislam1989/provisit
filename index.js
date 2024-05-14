const express = require("express");
const cors = require("cors");
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());


app.get("/test", async (req, res) => {
    res.send("This test result");
  });

// default route is here
app.get("/", (req, res) => {
  res.send("server is running well");
});

// app listen is here
app.listen(port, () => {
  console.log(`The server is running on port: ${port}`);
});