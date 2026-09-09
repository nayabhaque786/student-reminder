import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017"; // change if using Atlas
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("student_reminder"); // your database name
    console.log("MongoDB connected");
  }
  return db;
}

export { connectDB };
