
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

// =====================================
// TRUST PROXY
// =====================================

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// =====================================
// CORS CONFIGURATION
// =====================================

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// =====================================
// BODY PARSERS
// =====================================

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// =====================================
// SESSION CONFIGURATION
// =====================================

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

            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",

            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

// =====================================
// API ROUTES
// =====================================

app.use("/api/users", userRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/tests", testRoutes);

app.use("/api/tests", questionRoutes);

app.use("/api/results", resultRoutes);

// =====================================
// HOME ROUTE
// =====================================

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Welcome to KAVIKA Library Test API"
    });
});

// =====================================
// HEALTH CHECK
// =====================================

app.get("/api/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "KAVIKA Server is running"
    });
});

// =====================================
// UNKNOWN ROUTES
// =====================================

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

// =====================================
// GLOBAL ERROR HANDLER
// =====================================

app.use((error, req, res, next) => {
    console.error("Global Error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

// =====================================
// EXPORT APP
// =====================================

module.exports = app;

