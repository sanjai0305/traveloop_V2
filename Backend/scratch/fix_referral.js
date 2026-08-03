import mongoose from 'mongoose';

async function fix() {
  await mongoose.connect('mongodb://localhost:27017/traveloop-website');
  console.log("Connected to MongoDB.");
  
  const res = await mongoose.connection.db.collection('agents').updateMany(
    { referralCode: "" },
    { $unset: { referralCode: "" } }
  );
  console.log("Updated documents count:", res.modifiedCount);

  // Remove nulls if any exist
  const resNull = await mongoose.connection.db.collection('agents').updateMany(
    { referralCode: null },
    { $unset: { referralCode: "" } }
  );
  console.log("Updated null documents count:", resNull.modifiedCount);

  // Drop and recreate referralCode sparse index safely
  try {
    await mongoose.connection.db.collection('agents').dropIndex('referralCode_1');
    console.log("Dropped referralCode_1 index.");
  } catch (err) {
    console.log("Index drop note:", err.message);
  }

  await mongoose.connection.db.collection('agents').createIndex(
    { referralCode: 1 },
    { unique: true, sparse: true }
  );
  console.log("Re-created sparse index on referralCode.");

  process.exit(0);
}

fix().catch(err => {
  console.error("Fix script error:", err);
  process.exit(1);
});
