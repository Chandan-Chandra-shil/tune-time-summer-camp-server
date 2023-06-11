const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dyntprt.mongodb.net/?retryWrites=true&w=majority`;

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
    const usersCollection = client.db("tuneTimeDB").collection("users");
    const instructorsCollection = client
      .db("tuneTimeDB")
      .collection("instructors");
    const classesCollection = client.db("tuneTimeDB").collection("classes");
    const selectedClassesCollection = client
      .db("tuneTimeDB")
      .collection("selectedClasses");

    // classes get  api
    app.get("/all-class", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // classes  post api
    app.post("/all-class", async (req, res) => {
      const newClass = req.body;
      const result = await classesCollection.insertOne(newClass);
      res.send(result);
    });

    app.get("/all-instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });

    //users get api
    app.get("/all-users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // users post api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // users admin api 
    app.patch('/all-users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)

    })

    // selectedClasses get api
    app.get("/all-selectedClasses", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await selectedClassesCollection.find(query).toArray();
      res.send(result);
    });

    // selectedClasses post api
    app.post("/all-selectedClasses", async (req, res) => {
      const item = req.body;
      const result = await selectedClassesCollection.insertOne(item);
      res.send(result);
    });

    // selectedClasses delete api
    app.delete("/all-selectedClasses/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const result = await selectedClassesCollection.deleteOne(filter);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    /* await client.close(); */
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("tune time server is running ");
});

app.listen(port, () => {
  console.log(`tune time server is running on the PORT ${port}`);
});
