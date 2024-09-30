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

    // Step 1: Retrieve or initialize the document count
    const counterDoc = await collection.findOne({ name: 'documentCount' });
    
    if (!counterDoc) {
      // If no counter document exists, create one
      await collection.insertOne({ name: 'documentCount', count: 0 });
    }

    // Step 2: Increment the document count
    const newCount = (counterDoc ? counterDoc.count : 0) + 1;

    // Update the counter document with the new count
    await collection.updateOne(
      { name: 'documentCount' },
      { $set: { count: newCount } }
    );

    // Step 3: Prepare new data with a unique number
    const newData = {
      ...data,
      number: newCount // Assign a unique number to the new document
    };

    // Step 4: Insert the new document
    await collection.insertOne(newData);
    
    res.status(200).send('Data inserted successfully2');
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send('Error inserting data');
  }
});


// Endpoint to get average data from the last hour
app.get('/getLastHourData', async (req, res) => {
  try {
    // Step 1: Fetch the last 20 documents sorted by the 'number' field in descending order
    const last20Documents = await collection
      .find({})
      .sort({ number: -1 }) // Sort by 'number' in descending order to get the last inserted documents
      .limit(20) // Limit to the last 20 documents
      .toArray();

    // Step 2: Check if any documents are retrieved
    if (last20Documents.length === 0) {
      return res.status(404).send('No documents found');
    }

    // Step 3: Calculate the averages for the specified fields
    let totalTemperature = 0;
    let totalHumidity = 0;
    let totalSoilMoisture = 0;
    let totalLight = 0;
    let count = 0;

    last20Documents.forEach(doc => {
      if (doc.temperature != null) {
        totalTemperature += doc.temperature;
      }
      if (doc.humidity != null) {
        totalHumidity += doc.humidity;
      }
      if (doc.moisture != null) {
        totalSoilMoisture += doc.moisture;
      }
      if (doc.light != null) {
        totalLight += doc.light;
      }
      // Count how many fields have valid data
      if (doc.temperature != null || doc.humidity != null || doc.moisture != null || doc.light != null) {
        count++;
      }
    });

    // Avoid division by zero
    const avgTemperature = count > 0 ? totalTemperature / count : null;
    const avgHumidity = count > 0 ? totalHumidity / count : null;
    const avgSoilMoisture = count > 0 ? totalSoilMoisture / count : null;
    const avgLight = count > 0 ? totalLight / count : null;

    // Step 4: Respond with the calculated averages
    res.status(200).json({
      avgTemperature,
      avgHumidity,
      avgSoilMoisture,
      avgLight
    });
  } catch (error) {
    console.error("Error fetching last 20 documents average:", error);
    res.status(500).send('Error fetching last 20 documents average');
  }
});






// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
