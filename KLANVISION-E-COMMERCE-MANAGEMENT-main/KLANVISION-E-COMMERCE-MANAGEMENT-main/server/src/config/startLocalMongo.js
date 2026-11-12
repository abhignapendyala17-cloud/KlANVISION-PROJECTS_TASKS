require('./loadEnv');

const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isListening(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function findMongoExecutable() {
  const configuredPath = process.env.MONGOD_PATH;
  if (configuredPath) {
    if (fs.existsSync(configuredPath)) return configuredPath;
    throw new Error(`MONGOD_PATH does not exist: ${configuredPath}`);
  }

  const result = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['mongod'], {
    encoding: 'utf8',
    windowsHide: true
  });
  const executable = result.stdout?.split(/\r?\n/).find((candidate) => candidate.trim());
  if (result.status === 0 && executable) return executable.trim();
  throw new Error('MongoDB is not listening and mongod was not found. Install MongoDB Server, add mongod to PATH, or set MONGOD_PATH in server/.env.');
}

async function startLocalMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri || !/^mongodb:\/\//.test(uri)) return;

  const { hostname, port: configuredPort } = new URL(uri);
  const host = hostname.replace(/^\[|\]$/g, '');
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) return;

  const port = Number(configuredPort || 27017);
  if (await isListening(host, port)) {
    console.log(`Local MongoDB is already listening on ${host}:${port}`);
    return;
  }

  const executable = findMongoExecutable();
  const localData = process.env.LOCALAPPDATA || process.env.HOME || process.cwd();
  const dataPath = process.env.MONGODB_DATA_DIR || path.join(localData, 'MongoDB', 'data', 'ecommerce_inventory');
  const logPath = path.join(localData, 'MongoDB', 'logs', 'mongod.log');
  fs.mkdirSync(dataPath, { recursive: true });
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  const mongo = spawn(executable, [
    '--dbpath', dataPath,
    '--bind_ip', '127.0.0.1',
    '--port', String(port),
    '--logpath', logPath,
    '--logappend'
  ], { detached: true, stdio: 'ignore', windowsHide: true });
  mongo.unref();

  let spawnError;
  mongo.once('error', (error) => { spawnError = error; });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (spawnError) throw new Error(`Could not start MongoDB: ${spawnError.message}`);
    if (mongo.exitCode !== null) {
      throw new Error(`MongoDB exited with code ${mongo.exitCode}. Check its log: ${logPath}`);
    }
    if (await isListening(host, port)) {
      console.log(`Started local MongoDB on 127.0.0.1:${port}`);
      return;
    }
    await delay(200);
  }

  throw new Error(`MongoDB did not start listening on ${host}:${port}. Check its log: ${logPath}`);
}

startLocalMongo().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
