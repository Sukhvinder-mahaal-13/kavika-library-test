require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const readline = require("readline");
const Admin = require("./src/models/Admin");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) => {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
};

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("\nMongoDB Connected.");

        const admin = await Admin.findOne({
            mobile: "9058644706"
        }).select("+password");

        if (!admin) {
            console.log("\nAdmin account not found.");
            return;
        }

        console.log("\nAdmin found:", admin.name);

        const newPassword = await ask(
            "\nEnter your NEW admin password: "
        );

        if (newPassword.length < 8) {
            console.log("\nPassword must contain at least 8 characters.");
            return;
        }

        const confirmPassword = await ask(
            "Confirm your NEW password: "
        );

        if (newPassword !== confirmPassword) {
            console.log("\nPasswords do not match.");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            12
        );

        admin.email = "kavikagroup@gmail.com";
        admin.password = hashedPassword;

        await admin.save();

        console.log("\n================================");
        console.log("ADMIN ACCOUNT UPDATED SUCCESSFULLY");
        console.log("================================");
        console.log("Email: kavikagroup@gmail.com");
        console.log("Mobile: 9058644706");
        console.log("Password: Updated successfully.");

    } catch (error) {
        console.error("\nAdmin Update Error:", error.message);

    } finally {
        rl.close();
        await mongoose.disconnect();
    }
};

fixAdmin();