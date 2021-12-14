import express from "express";
import { initSyncService } from "./sync.service";
import { DEFAULT_PORT } from "./constants";
import { initDenadb } from "./denadb";
const PORT = process.env.PORT || DEFAULT_PORT;

async function initializeServer() {
	await initDenadb();

	const app = express()
	app.get('/', (req, res) => {
		res.sendFile(__dirname + "/index.html")
	});
	const server = app.listen(PORT, () => console.log('server running on port ', PORT));
	await initSyncService(server);
}

initializeServer().then(() => console.log("started dena-review server."));