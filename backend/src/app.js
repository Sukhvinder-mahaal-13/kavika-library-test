const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const testRoutes = require("./routes/test.routes");
const questionRoutes = require("./routes/question.routes");
const resultRoutes = require("./routes/result.routes");

const app = express();

// Trust proxy
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// CORS configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true
    })
);

// Parse incoming JSON
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
    session({
        name: "kavika.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: "sessions",
            ttl: 24 * 60 * 60
        }),

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/tests", questionRoutes);
app.use("/api/results", resultRoutes);

// Home route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to KAVIKA Library Test API"
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "KAVIKA Server is running"
    });
});

// Unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Global Error:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

module.exports = app;