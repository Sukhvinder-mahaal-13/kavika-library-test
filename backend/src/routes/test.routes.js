
const express = require("express");

const router = express.Router();

const {
    createTest,
    getAllTests,
    getUpcomingTest,
    unlockTest,
    getTestDetails,
    updateTestStatus,
    deleteTest
} = require("../controllers/test.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// ==========================================
// USER ROUTES
// ==========================================

// Get upcoming test
router.get(
    "/upcoming",
    authMiddleware,
    getUpcomingTest
);

// Unlock test using Access Key
router.post(
    "/:testId/unlock",
    authMiddleware,
    unlockTest
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Create a new test
router.post(
    "/",
    adminMiddleware,
    createTest
);

// Get all tests
router.get(
    "/",
    adminMiddleware,
    getAllTests
);

// Get particular test details
router.get(
    "/:testId",
    adminMiddleware,
    getTestDetails
);

// Update test status
router.patch(
    "/:testId/status",
    adminMiddleware,
    updateTestStatus
);

// Delete a test
router.delete(
    "/:testId",
    adminMiddleware,
    deleteTest
);


module.exports = router;