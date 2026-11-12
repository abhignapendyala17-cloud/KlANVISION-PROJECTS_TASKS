const path = require("node:path");
const fs = require("node:fs");
const { MongoMemoryServer } = require("mongodb-memory-server");

async function startLocalDatabase() {
  const dbPath = path.resolve(__dirname, "../data/mongodb");
  fs.mkdirSync(dbPath, { recursive: true });
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbPath,
      ip: "127.0.0.1",
      port: 27017,
    },
  });

  console.log(`Local MongoDB listening at ${mongo.getUri()}`);
  console.log(`Persistent database files: ${dbPath}`);
  const stop = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

startLocalDatabase().catch((error) => {
  console.error("Unable to start local MongoDB:", error);
  process.exitCode = 1;
});
