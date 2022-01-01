const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config();
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;

//middle weares
app.use(cors());
app.use(express.json());

//mongodb connection tools
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y4qnm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();

        //db
        const database = client.db("heroRider");
        // db collections
        const userCollection = database.collection("users");
        const packageCollection = database.collection("packages");

        //post users
        app.post('/users', async (req, res) => {
            const doc = req.body;
            const result = await userCollection.insertOne(doc);
            res.send(result);
        });

        // get single user by email
        app.get('/users', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        });

        // get all data api 
        app.get('/users', async (req, res) => {
            const query = parseInt(req.query?.size);
            const cursor = userCollection.find({}).sort({ "_id": -1 });

            let result;
            if (query) {
                result = await cursor.limit(query).toArray();
            }
            else {
                result = await cursor.toArray();
            }
            res.send(result);
        });


        //block users
        app.put('/users', async (req, res) => {
            const doc = req.body;
            console.log(doc)
            // const query = { _id: ObjectId(id) };
            // const updateDoc = { $set: doc };
            // const options = { upsert: true };
            // const result = await appointmentCollection.updateOne(query, updateDoc, options);
            // res.send(result);
        });

        // //delete users
        // app.delete('/users', async (req, res) => {
        //     const data = req.body.selectedUsers;
        //     console.log(req);
        //     console.log('hit')
        // });

        //check admin
        app.get('/admin', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // get all packages
        app.get('/packages', async (req, res) => {
            const email = req.query.email;
            const cursor = packageCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        // get single data api 
        app.get('/packages/:id', async (req, res) => {
            const id = req.params.id;
            const query = { type: id };
            const result = await packageCollection.findOne(query);
            res.send(result);
        });

        //stripe payment intention
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        });


    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);



//default api's
app.get('/', (req, res) => {
    res.send('Databse is live');
});

app.listen(port, () => {
    console.log('DB is running on port', port);
});