require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 4545;
const cors = require("cors");

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fx40ttv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("job_task_Toposel");
    const userInfoCollection = database.collection("user_info");

    app.get("/", (req, res) => {
      res.send("Hello World!");
    });

    // user info add in the db
    app.post("/add-user", async (req, res) => {
      const userInfo = req.body;
      const result = await userInfoCollection.insertOne(userInfo);
      res.send(result);
    });

    app.get("/login-user", async (req, res) => {
      const loginInfo = req.query;
      const userEmail = { email: loginInfo?.email };
      const userPass = { password: loginInfo?.pass };
      const isMatchEmail = await userInfoCollection.findOne(userEmail);
      if (isMatchEmail) {
        if (isMatchEmail.password === userPass?.password) {
          return res.send({ status: true });
        } else {
          return res.send({ status: false, message: "Incorrect password" });
        }
      } else {
        return res.send({ status: false, message: "Email not found" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
