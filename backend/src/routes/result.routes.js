const express = require("express");

const router = express.Router();

const {
    submitTest,
    getMyResult,
    getMyResults,
    getAdminTestResults,
    updateResultVisibility
} = require("../controllers/result.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// =====================================
// STUDENT ROUTES
// =====================================

// Get all published results of logged-in student
router.get(
    "/my-results",
    authMiddleware,
    getMyResults
);

// Submit test
router.post(
    "/:testId/submit",
    authMiddleware,
    submitTest
);

// Get student's own result and Top 3 leaderboard
router.get(
    "/:testId/my-result",
    authMiddleware,
    getMyResult
);

// =====================================
// ADMIN ROUTES
// =====================================

// Get all students' results and rankings for a test
router.get(
    "/:testId/admin-results",
    adminMiddleware,
    getAdminTestResults
);

// Publish or hide results
router.patch(
    "/:testId/visibility",
    adminMiddleware,
    updateResultVisibility
);

module.exports = router;