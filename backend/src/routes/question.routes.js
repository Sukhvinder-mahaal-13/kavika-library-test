const express = require("express");
const router = express.Router();

const {
createQuestion,
getAdminQuestions,
getStudentQuestions,
deleteQuestion
} = require("../controllers/question.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all questions of a test
router.get(
"/:testId/questions",
adminMiddleware,
getAdminQuestions
);

// Add a new question
router.post(
"/:testId/questions",
adminMiddleware,
createQuestion
);

// Delete one question
router.delete(
"/:testId/questions/:questionId",
adminMiddleware,
deleteQuestion
);

// ==========================================
// STUDENT ROUTES
// ==========================================

// Get questions for a live test
router.get(
"/:testId/questions/student",
authMiddleware,
getStudentQuestions
);

module.exports = router;
