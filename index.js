const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zfuxqes.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const productsCollection = client.db("eShopDB").collection("products");

    // api start

    app.get("/products", async (req, res) => {
      const {
        page = 1,
        limit = 9,
        search = "",
        category = "",
        minPrice = 0,
        maxPrice = Infinity,
        sortBy = "",
        brand = "",
      } = req.query;

      try {
        let query = {};

        if (search) {
          query.product_name = { $regex: search, $options: "i" };
        }

        if (category) {
          query.category = { $regex: category, $options: "i" };
        }

        if (minPrice || maxPrice) {
          query.price = {
            $gte: parseFloat(minPrice),
            $lte: parseFloat(maxPrice),
          };
        }

        if (brand) {
          query.brand_name = { $regex: brand, $options: "i" };
        }

        let sort = {};
        if (sortBy === "priceLowToHigh") {
          sort.price = 1;
        } else if (sortBy === "priceHighToLow") {
          sort.price = -1;
        } else if (sortBy === "newestFirst") {
          sort.product_creation_date = -1;
        }

        const products = await productsCollection
          .find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .toArray();

        const count = await productsCollection.countDocuments(query);

        res.json({
          products,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
        });
      } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// root api
app.get("/", (req, res) => {
  res.send("eShop server running");
});

app.listen(port, () => {
  console.log(`eShop server running on port : ${port}`);
});
