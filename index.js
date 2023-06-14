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

// verifyJWT
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
    const usersCollection = client.db("sports_academies").collection("users");
    const selectCollection = client.db("sports_academies").collection("selects");
    const manageClassesCollection = client.db("sports_academies").collection("manage_class");
    
  // jwt post 
    app.post("/jwt",(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"1h"});
      res.send({token})
    })

    // manage class send data default status pending
    app.post("/manage_classes",async(req,res)=>{
      const body = req.body;
      const result = await manageClassesCollection.insertOne({...body,status:"pending"})
      res.send(result)
    })

    // manage class data get from mongodb
    app.get("/manage_classes",async(req,res)=>{
      const result = await manageClassesCollection.find().toArray();
      res.send(result)
    })

     // manage classes find specific data using id
     app.get("/manage_classes/:id", async (req, res) => {
       const id = req.params.id;
       const filter = { _id: new ObjectId(id) };
       const result = await manageClassesCollection.findOne(filter);
       res.send(result);
     });

    // manage classes update specific data using id
    app.put("/update_class/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const body = req.body;
      const updateDoc = {
        $set: {
          price: body.price,
          class_name: body.class_name,
          class_image: body.class_image,
          available_seats: body.available_seats,
        },
      };
      const result = await manageClassesCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });
    
    // manage classes status approved
    app.patch("/manage_classes/:id",async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateDoc = {
        $set:{
          status:"approved"
        }
      }
      const result = await manageClassesCollection.updateOne(filter,updateDoc)
      res.send(result)
    })

    // academie Instructors get data from mongodb
    app.get("/instructors",async(req,res)=>{
        const result = await academieInstructorsCollection.find().toArray();
        res.send(result);
    })
    
    // instructors send data 
    app.post("/instructors",async(req,res)=>{
      const body = req.params.body;
      const result = await academieInstructorsCollection.insertOne(body)
      res.send(result);
    })

    // academie users set data by default role student
    app.post("/users",async(req,res)=>{
      const body = req.body;
      const result = await usersCollection.insertOne({
        ...body,
        role:"student"
      });
      res.send(result)
    })

    // academie get user from database
    app.get("/users", async(req,res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    // academie users role change role admin
    app.patch("/users/admin/:id",async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateDoc = {
        $set:{
          role:"admin"
        }
      }
      const result = await usersCollection.updateOne(filter,updateDoc)
      res.send(result)
    })

    // academie users role change role instructor
    app.patch("/users/instructor/:id",async(req,res)=>{
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const updateDoc = {
        $set:{
          role:"instructor"
        }
      }
      const result = await usersCollection.updateOne(filter,updateDoc)
      res.send(result)
    })

     // academie student selects class
     app.post("/selects",async(req,res)=>{
      let id = req.body._id;
      const body = req.body;
      const result = await selectCollection.insertOne(body);
      res.send(result)
     })

    //specific user specific data using email
    app.get("/selects", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await selectCollection.find(query).toArray();
      res.send(result)
    });

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

    // academie admin
    app.get('/users/admin/:email',async(req,res)=>{
      const email = req.params.email;
      const query = {email:email}
      const user = await usersCollection.findOne(query);
      const result = {admin : user?.role === "admin"}
      res.send(result);
    })

    // academie instructor
    app.get('/users/instructor/:email',async(req,res)=>{
      const email = req.params.email;
      const query = {email:email}
      const user = await usersCollection.findOne(query);
      const result = {admin : user?.role === "instructor"}
      res.send(result);
    })

    // academie student
    app.get('/users/student/:email',async(req,res)=>{
      const email = req.params.email;
      const query = {email:email}
      const user = await usersCollection.findOne(query);
      const result = {admin : user?.role === "student"}
      res.send(result);
    })


    // academie selects class delete
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
