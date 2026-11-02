const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: /^[6-9]\d{9}$/
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            default: "admin",
            immutable: true
        }
    },
    {
        timestamps: true
    }
);

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;