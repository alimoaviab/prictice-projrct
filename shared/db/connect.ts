import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __edu_mongoose_connection: Promise<typeof mongoose> | undefined;
}

export async function connectDb(uri = process.env.MONGODB_URI): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error("MONGODB_URI is required.");
  }

  if (!global.__edu_mongoose_connection) {
    global.__edu_mongoose_connection = mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== "production",
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000
    });
  }

  return global.__edu_mongoose_connection;
}
