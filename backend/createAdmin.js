require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const readline = require("readline");
const Admin = require("./src/models/Admin");

const ADMIN_DETAILS = {
name: "Arvind Kumar",
email: "[kavikagroup@gmail.com](mailto:kavikagroup@gmail.com)",
mobile: "9058644706"
};

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

const createMainAdmin = async () => {
try {
await mongoose.connect(process.env.MONGODB_URI);


    console.log("\nMongoDB Connected.");

    const existingAdmin = await Admin.findOne({
        $or: [
            { email: ADMIN_DETAILS.email },
            { mobile: ADMIN_DETAILS.mobile }
        ]
    });

    if (existingAdmin) {
        console.log("\nAdmin account already exists.");
        return;
    }

    const password = await new Promise((resolve) => {
        rl.question("\nEnter Main Admin Password: ", resolve);
    });

    if (password.length < 8) {
        console.log("\nPassword must contain at least 8 characters.");
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await Admin.create({
        ...ADMIN_DETAILS,
        password: hashedPassword,
        role: "admin"
    });

    console.log("\n================================");
    console.log("MAIN ADMIN CREATED SUCCESSFULLY");
    console.log("================================");
    console.log("Name:", ADMIN_DETAILS.name);
    console.log("Email:", ADMIN_DETAILS.email);
    console.log("Mobile:", ADMIN_DETAILS.mobile);

} catch (error) {
    console.error("\nAdmin Setup Error:", error.message);

} finally {
    rl.close();
    await mongoose.disconnect();
}


};

createMainAdmin();
