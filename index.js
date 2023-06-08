const expresss = require('express');
const app = expresss ();
require('dotenv').config()
const cors = require("cors")
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

// middleware
app.use(cors())
app.use(expresss.json())

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
