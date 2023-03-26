const express = require('express');
const app = express();
const Connection = require('./Database/MongoConnection');
const cors = require('cors');

app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

app.get('/', (req, res) => {
  res.send('Hare Krishna');
});

app.get('/get-list/:place', async (req, res) => {
  try {
    const collection = Connection.client.db('RamyaSthan').collection(`${req.params.place}`);
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data');
  }
});

app.get('/search/:keyword', async (req, res) => {
  try {
    const collection1 = Connection.client.db('RamyaSthan').collection('govardhan');
    const collection2 = Connection.client.db('RamyaSthan').collection('vrindavan');
    const regex = new RegExp(req.params.keyword, 'i');

    const pipeline = [
      {
        $match: { name: regex } 
      },
      {
        $project: { _id: 0 } 
      },
      {
        $unionWith: {
          coll: 'vrindavan', // add documents from collection2 to the pipeline
          pipeline: [
            { $match: { name: regex } }, // match documents in collection2 with the keyword
            { $project: { _id: 0 } } // exclude _id field from the result
          ]
        }
      },
      {
        $lookup: {
          from: 'vrindavan', // join collection2 with collection1
          localField: 'name',
          foreignField: 'name',
          as: 'joinedData'
        }
      },
      {
        $lookup: {
          from: 'govardhan', // join collection1 with collection2
          localField: 'name',
          foreignField: 'name',
          as: 'joinedData'
        }
      },
      {
        $project: { joinedData: 0 } // exclude the joinedData field from the result
      }
    ];
    const data = await collection1.aggregate(pipeline).toArray();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data');
  }
});

app.get('/get-content/:keyword', async (req, res) => {
  try {
    let str =  req.params.keyword.replace(/-/g, ' ');
    const collection1 = Connection.client.db('RamyaSthan').collection('govardhan');
    const collection2 = Connection.client.db('RamyaSthan').collection('vrindavan');
    const regex = new RegExp(str, 'i');

    const pipeline = [
      {
        $match: { name: regex } 
      },
      {
        $project: { _id: 0 } 
      },
      {
        $unionWith: {
          coll: 'vrindavan', // add documents from collection2 to the pipeline
          pipeline: [
            { $match: { name: regex } }, // match documents in collection2 with the keyword
            { $project: { _id: 0 } } // exclude _id field from the result
          ]
        }
      },
      {
        $lookup: {
          from: 'vrindavan', // join collection2 with collection1
          localField: 'name',
          foreignField: 'name',
          as: 'joinedData'
        }
      },
      {
        $lookup: {
          from: 'govardhan', // join collection1 with collection2
          localField: 'name',
          foreignField: 'name',
          as: 'joinedData'
        }
      },
      {
        $project: { joinedData: 0 } // exclude the joinedData field from the result
      }
    ];
    const data = await collection1.aggregate(pipeline).toArray();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data');
  }
});

app.get('/list-collections',async (req,res) => {
  try {
    const collections = await Connection.client.db('RamyaSthan').listCollections().toArray();
    const collectionNames = collections.map(collection => collection.name);
    res.json(collectionNames);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching collections');
  }
});

app.get('/global-api', async (req, res) => {
  try {
    const visitorIp = req.ip;
    const collection = Connection.client.db('IskconSolapur').collection('visitorCount');

    const visitor = await collection.findOne({ ip: visitorIp });
    if (visitor) {
      // If visitor exists, increment count
      visitor.count++;
      visitor.date = new Date();
      await collection.updateOne({ _id: visitor._id }, { $set: visitor })
    } else {
      // If visitor does not exist, create a new document with count = 1
      const newVisitor = { ip: visitorIp, count: 1 };
      await collection.insertOne(newVisitor);
    }

    // Fetch all visitors for the given place
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data');
  }
});


const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
