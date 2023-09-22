const express = require('express');
const app=express();
const cors = require('cors');
require('dotenv').config()
const port=process.env.PORT || 5000;
const jwt=require('jsonwebtoken')

//middlewares

app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
      return res.status(401).send({ error: true, message: 'unauthorized access' });
  }

  const token = authorization.split(' ')[1];


  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
      if (err) {
          return res.status(401).send({ error: true, message: 'unauthorized access' });
      }

      req.decoded = decoded;
      next();
  })
}


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
     client.connect();

    const symptonsCollection=client.db("mindDb").collection("symptons")
    const usersCollection = client.db('mindDb').collection('users');

    
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1hr' })

      res.send({ token });

  })


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


  // Verifying admin
  app.get('/users/admin/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;

    if (req.decoded.email !== email) {
        return res.send({ admin: false }); // Use return to exit the function
    }

    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const result = { admin: user?.role === 'admin' };
    res.send(result);
});

// Verifying Therapists
app.get('/users/therapist/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;

    if (req.decoded.email !== email) {
        return res.send({ therapist: false }); // Use return to exit the function
    }

    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const result = { therapist: user?.role === 'therapist' };
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