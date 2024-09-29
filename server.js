const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000; // or any port you prefer

// MongoDB connection string (replace 'your_database' and 'your_collection' with actual names)
const uri = "mongodb+srv://nutriplan:nutriplan@cluster0.g4fpurd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db, collection; // Variables to store database and collection

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB once and reuse the connection
client.connect()
  .then(() => {
    console.log("Connected to MongoDB");
    db = client.db('your_database'); // replace with your actual database name
    collection = db.collection('your_collection'); // replace with your actual collection name
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB", err);
  });

// Endpoint to insert data
app.post('/insert', async (req, res) => {
  try {
    const data = req.body; // Expecting JSON data
    await collection.insertOne(data);
    res.status(200).send('Data inserted successfully');
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send('Error inserting data');
  }
});

// Endpoint to get average data from the last hour
app.get('/getLastHourData', async (req, res) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // Get timestamp for one hour ago

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: oneHourAgo } // Filter for documents from the last hour
        }
      },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: "$temperature" },
          avgHumidity: { $avg: "$humidity" },
          avgSoilMoisture: { $avg: "$soilMoisture" },
          avgLight: { $avg: "$light" }
        }
      }
    ];

    const result = await collection.aggregate(pipeline).toArray();

    if (result.length > 0) {
      res.status(200).json(result[0]); // Send the averaged result
    } else {
      res.status(404).send('No data found in the last hour');
    }
  } catch (error) {
    console.error("Error fetching last hour data:", error);
    res.status(500).send('Error fetching last hour data');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
