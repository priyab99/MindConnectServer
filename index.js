const express = require('express');
const app=express();
const cors = require('cors');
require('dotenv').config()
const port=process.env.PORT || 5000;
const jwt=require('jsonwebtoken')

//middlewares

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s3cfwic.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const symptonsCollection=client.db("mindDb").collection("symptons")
    const usersCollection = client.db('mindDb').collection('users');


  //user related api
   app.get('/users',async(req,res)=>{
    const result=await usersCollection.find().toArray();
    res.send(result);
   })

  app.post('/users', async (req, res) => {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    res.send(result);
});

 // Update user role as admin
 app.patch('/users/admin/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
      $set: {
          role: 'admin'
      },
  };

  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
})


// Update user role as therapist
app.patch('/users/therapist/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
      $set: {
          role: 'therapist'
      },
  };

  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});

    //symptoms related api
    app.get('/symptons',async(req,res)=>{
        const result=await symptonsCollection.find().toArray();
        res.send(result);
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
    res.send('server is running')
})

app.listen(port, ()=>{
    console.log(`server is running on port ${port}`)
})