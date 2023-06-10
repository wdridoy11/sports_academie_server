const expresss = require('express');
const app = expresss ();
require('dotenv').config()
const cors = require("cors")
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors())
app.use(expresss.json())

const verifyJWT=(req,res,next)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true, message:"User Unauthorized access"})
  }
  const token = authorization.split(" ")[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
    if(err){
      return res.status(401).send({error:true, message:"User Unauthorized access"})
    }
    req.decoded= decoded;
    next();
  })
}


// mongodb connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v2v9b72.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect();

    const academieInstructorsCollection = client.db("sports_academies").collection("academies_instructors");
    const classeCollection = client.db("sports_academies").collection("classe");
    const usersCollection = client.db("sports_academies").collection("users");
    const selectCollection = client.db("sports_academies").collection("selects");
    

    app.post("/jwt",(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"1h"});
      res.send({token})
    })

    // academie Instructors data get
    app.get("/instructors",async(req,res)=>{
        const result = await academieInstructorsCollection.find().toArray();
        res.send(result);
    })

    // academie Instructors create class 
    app.post('/add_classes',async(req,res)=>{
      const body = req.body;
      const result = await classeCollection.insertOne(body);
      res.send(result)
    })

    // academie get classes data
    app.get("/classes",async(req,res)=>{
      const result = await classeCollection.find().toArray();
      res.send(result);
    })

    // academie users set data
    app.post("/users",async(req,res)=>{
      const body = req.body;
      const result = await usersCollection.insertOne(body);
      res.send(result)
    })

    // academie get users data
    app.get("/users",async(req,res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    // academie users admin
    app.patch("/users/admin/:id",async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateDoc = {
        $set:{
          role:"admin"
        }
      }
      const result = await classeCollection.updateOne(filter,updateDoc)
      res.send(result)
    })

     // academie set selects data
     app.post("/selects",async(req,res)=>{
      const body = req.body;
      const result = await selectCollection.insertOne(body);
      res.send(result)
     })

     // academie get selects data
     app.get("/selects",async(req,res)=>{
      const result = await selectCollection.find().toArray();
      res.send(result)
     })

    //  stripe payment methord
    app.post("/create_payment_intent",async(req,res)=>{
      const {price} = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency:"usd",
        payment_method_types:[
          "card"
        ]
      })
      res.send({
        clientSecret:paymentIntent.client_secret
      })
    })

    // academie selects delete
    app.delete("/selects/:id",async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const result = await selectCollection.deleteOne(filter)
      res.send(result)
    })

    // academie user delete
    app.delete("/users/:id",async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const result = await usersCollection.deleteOne(filter)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("server is running")
})
app.listen(port,()=>{
    console.log("server is running")
})
