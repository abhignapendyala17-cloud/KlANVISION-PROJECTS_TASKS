require("dotenv").config();
const app = require("./app");
const connectDatabase = require("./config/db");

const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET) {
  console.error("Unable to start the API: JWT_SECRET is required in server/.env.");
  process.exit(1);
}

connectDatabase()
  .then(() => {
    const server = app.listen(port, "127.0.0.1", () => {
      console.log(`Healthcare API listening on http://127.0.0.1:${port}`);
    });
    server.on("error", (error) => {
      console.error(`Unable to listen on port ${port}: ${error.code || error.name || "Error"}`);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error(`Unable to start the API because MongoDB is unavailable (${error.name || "Error"}).`);
    process.exit(1);
  });
