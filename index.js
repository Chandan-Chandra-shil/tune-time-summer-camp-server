const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const app = express();



const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, massage: "unauthorized access" });
  }
  //BEARER TOKEN
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, massage: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

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

    //JWT TOKEN
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

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

    // check admin api
    app.get("/allusers/admin/:email", async (req, res) => {
      const email = req.params.email;
      /*  console.log('email...',email) */
      /* if (req.decoded.email !== email) {
        res.send({ admin:false});
      } */
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });
    // check instructor api
    app.get(
      "/allusers/admin/instructor/:email",
      verifyJWT,
      async (req, res) => {
        const email = req.params.email;
       /*  if (req.decoded.email !== email) {
          res.send({ admin: false });
        } */
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        const result = { instructor: user?.role === "instructor" };
        res.send(result);
      }
    );

    // users make a admin api
    app.patch("/all-users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // users make a instructor api
    app.patch("/admin/instructor/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const modify = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(modify, updateDoc);
      res.send(result);
    });

    // selectedClasses get api
    app.get("/all-selectedClasses", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      /* const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({error:true,massage:'forbidden access'})
      } */
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
    // create payment  intent
    app.post("/content-payment-intent",async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
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
