const Admin = require("../models/Admin");

const isAdminAuthenticated = async (req, res, next) => {
    try {
        // Check admin ID in session
        const adminId = req.session?.adminId;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Admin login required."
            });
        }

        // Find admin in database
        const admin = await Admin.findById(adminId);

        if (!admin) {
            if (req.session) {
                req.session.adminId = null;
            }

            return res.status(401).json({
                success: false,
                message: "Admin not found. Please login again."
            });
        }

        // Verify admin role
        if (admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin permission required."
            });
        }

        // Attach admin to request
        req.admin = admin;

        // Continue
        return next();

    } catch (error) {
        console.error("Admin Authentication Error:", error);

        return res.status(500).json({
            success: false,
            message: "Admin authentication failed."
        });
    }
};

module.exports = isAdminAuthenticated;