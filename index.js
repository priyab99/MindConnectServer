const express = require('express');
const app=express();
const cors = require('cors');
require('dotenv').config()
const stripe= require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port=process.env.PORT || 5000;
const jwt=require('jsonwebtoken')

//middlewares
app.use(cors({
  origin: ["http://localhost:5173", "https://mindconnect.web.app"],
}));


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

    
    const usersCollection = client.db('mindDb').collection('users');
    const therapistsCollection = client.db('mindDb').collection('therapists');
    const appointmentsCollection=client.db('mindDb').collection('appointments');
    const paymentCollection=client.db('mindDb').collection('payments');
    const progressCollection=client.db('mindDb').collection('progress');

    
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
        return res.send({ admin: false }); // Using return to exit the function
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
        return res.send({ therapist: false }); // Using return to exit the function
    }

    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const result = { therapist: user?.role === 'therapist' };
    res.send(result);
});

 // Updating user role as admin
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


// Updating user role as therapist
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


   //therapists Api
    app.get('/therapists',async(req,res)=>{
      const result=await therapistsCollection.find().toArray();
      res.send(result);
  })

  
  // Handling appointment submissions
  app.post('/appointments', async (req, res) => {
    const appointmentData = req.body;
    appointmentData.therapistEmail = req.body.therapistEmail; 
    appointmentData.therapistName=req.body.therapistName;
    const result = await appointmentsCollection.insertOne(appointmentData);
    res.send(result);
  });

  app.get('/appointments',async(req,res)=>{
    const result=await appointmentsCollection.find().toArray();
    res.send(result);
  })

  //payment related api's
 
  app.post('/create-payment-intent', verifyJWT, async (req, res) => {
    const { price } = req.body;
    const amount = price * 100; // Converting to cents
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });
  
    res.send({
      clientSecret: paymentIntent.client_secret
    });
  });
  

  
  app.post('/payment', verifyJWT, async(req,res)=>{
    const payment=req.body;
    const result=await paymentCollection.insertOne(payment);
    res.send(result);
  })

  app.get('/payment',async(req,res)=>{
    const result=await paymentCollection.find().toArray();
    res.send(result);
  })
  
  //patient progress related API
  app.post('/progress', async(req,res)=>{
    const progress=req.body;
    const result=await progressCollection.insertOne(progress);
    res.send(result);
  })

  app.get('/progress',async(req,res)=>{
    const result=await progressCollection.find().toArray();
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