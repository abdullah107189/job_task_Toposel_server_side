require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 4545;
const cors = require("cors");
const jwt = require("jsonwebtoken");

// middleware
app.use(cors());
app.use(express.json());

const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.user = decoded;
    next();
  });
};

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
      const existingUser = await userInfoCollection.findOne({
        email: userInfo.email,
      });
      if (existingUser) {
        return res.status(409).send({ message: "User Email already exists." });
      }
      const result = await userInfoCollection.insertOne(userInfo);
      const token = jwt.sign(
        { email: userInfo.email },
        process.env.ACCESS_TOKEN,
        {
          expiresIn: "1h",
        }
      );
      res.send({ result, token });
    });

    // login user
    app.get("/login-user", async (req, res) => {
      const loginInfo = req.query;
      const userEmail = { email: loginInfo?.email };
      const userPass = { password: loginInfo?.pass };
      const isMatchEmail = await userInfoCollection.findOne(userEmail);
      if (isMatchEmail) {
        if (isMatchEmail.password === userPass?.password) {
          const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN, {
            expiresIn: "1h",
          });
          return res.send({ status: true, token });
        } else {
          return res.send({ status: false, message: "Incorrect password" });
        }
      } else {
        return res.send({ status: false, message: "Email not found" });
      }
    });

    // search implement

    app.get("/searchUser", verifyToken, async (req, res) => {
      try {
        const { query } = req.query;
        let users;

        if (!query) {
          users = await userInfoCollection.find().toArray();
          return res.send(users);
        } else {
        }

        users = await userInfoCollection
          .find(
            {
              $or: [
                { username: { $regex: query, $options: "i" } }, // ✅ Case-insensitive regex search
                { email: { $regex: query, $options: "i" } },
              ],
            },
            { projection: { password: 0 } }
          )
          .toArray();

        if (users.length === 0) {
          return res.send([]);
        }

        res.send(users);
      } catch (error) {
        console.error("Search Error:", error);
        res.status(500).send({ message: "Internal server error!" });
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
