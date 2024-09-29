const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000; // or any port you prefer

// Replace with your actual MongoDB connection string
const uri = "mongodb+srv://nutriplan:nutriplan@cluster0.g4fpurd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; 
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(bodyParser.json());

app.post('/insert', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('your_database');
    const collection = database.collection('your_collection');

    const data = req.body; // Expecting JSON data
    await collection.insertOne(data);

    res.status(200).send('Data inserted successfully');
  } catch (error) {
    res.status(500).send('Error inserting data');
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
