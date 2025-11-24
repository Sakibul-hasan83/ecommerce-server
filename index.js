const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f4ofb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

async function run() {
  try {
    await client.connect();

    const userCollections = client.db("ShavBazar").collection("Collections");
    const AllProductsCollections = client.db("ShavBazar").collection("AllProducts");
   


// user save in database 
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollections.insertOne(user);
      res.send(result);
    });

    app.get('/users', verifyToken, async (req, res) => {
      const users = await userCollections.find().toArray();
      res.send(users);
    });



    // get all products
      app.get('/allproducts', async(req, res) => {
      const AllProducts = await AllProductsCollections.find().toArray();
      res.send(AllProducts);
    });




// create jwt 
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
      
// send token to cookie 
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // for localhost
        sameSite: "lax"
      }).send({ success: true });
    });

    function verifyToken(req, res, next) {
      const token = req.cookies?.token;
      if (!token) return res.status(401).send({ message: "Unauthorized" });

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send({ message: "Forbidden" });
        req.decoded = decoded;
        next();
      });
    }

    app.post('/login', async (req, res) => {
      res.send('Login route - implement later');
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully!");
  } catch (err) {
    console.error(err);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('setup done!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
