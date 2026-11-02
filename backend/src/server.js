require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const registerTestSocket = require("./sockets/test.socket");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
cors: {
origin: process.env.CLIENT_URL || "http://localhost:5173",
methods: ["GET", "POST"],
credentials: true
}
});

// Register Socket.IO events
registerTestSocket(io);

// Start server after MongoDB connection
const startServer = async () => {
try {
await connectDB();


    server.listen(PORT, () => {
        console.log(`KAVIKA Server running on port ${PORT}`);
        console.log(`API: http://localhost:${PORT}`);
        console.log("Socket.IO is ready.");
    });

} catch (error) {
    console.error("Server Startup Failed:", error);
    process.exit(1);
}


};

startServer();
