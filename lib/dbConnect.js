import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  // during tests or initial setup we won't crash the build; callers should handle missing env
  console.warn('MONGO_URI not set. Set MONGO_URI in .env.local');
}

let cached = global.mongoose;

if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      // these options are managed by mongoose defaults in v6+, keep empty
    }).then((m) => m.connection);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
