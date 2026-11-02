
const express = require("express");

const router = express.Router();

const {
    adminLogin,
    adminLogout,
    getCurrentAdmin,
    getRegisteredStudents,
    getArchivedStudents,
    getStudentDetails,
    archiveStudent,
    restoreStudent,
    deleteStudent,
    deleteAllStudents,
    closeTest
} = require("../controllers/admin.controller");

const isAdminAuthenticated = require("../middlewares/admin.middleware");

// =====================================
// ADMIN LOGIN
// POST /api/admin/login
// =====================================

router.post(
    "/login",
    adminLogin
);

// =====================================
// ADMIN LOGOUT
// POST /api/admin/logout
// =====================================

router.post(
    "/logout",
    isAdminAuthenticated,
    adminLogout
);

// =====================================
// GET CURRENT ADMIN
// GET /api/admin/me
// =====================================

router.get(
    "/me",
    isAdminAuthenticated,
    getCurrentAdmin
);

// =====================================
// GET ACTIVE REGISTERED STUDENTS
// GET /api/admin/students
// =====================================

router.get(
    "/students",
    isAdminAuthenticated,
    getRegisteredStudents
);

// =====================================
// GET ARCHIVED STUDENTS
// GET /api/admin/students/archived
// =====================================

router.get(
    "/students/archived",
    isAdminAuthenticated,
    getArchivedStudents
);

// =====================================
// GET SINGLE STUDENT DETAILS
// GET /api/admin/students/:userId
// =====================================

router.get(
    "/students/:userId",
    isAdminAuthenticated,
    getStudentDetails
);

// =====================================
// ARCHIVE ONE STUDENT
// PATCH /api/admin/students/:userId/archive
// =====================================

router.patch(
    "/students/:userId/archive",
    isAdminAuthenticated,
    archiveStudent
);

// =====================================
// RESTORE ONE STUDENT
// PATCH /api/admin/students/:userId/restore
// =====================================

router.patch(
    "/students/:userId/restore",
    isAdminAuthenticated,
    restoreStudent
);

// =====================================
// DELETE ONE STUDENT PERMANENTLY
// DELETE /api/admin/students/:userId
// =====================================

router.delete(
    "/students/:userId",
    isAdminAuthenticated,
    deleteStudent
);

// =====================================
// DELETE ALL STUDENT ACCOUNTS
// DELETE /api/admin/students
// =====================================

router.delete(
    "/students",
    isAdminAuthenticated,
    deleteAllStudents
);

// =====================================
// ADMIN MANUALLY CLOSE TEST
// POST /api/admin/tests/:testId/close
// =====================================

router.post(
    "/tests/:testId/close",
    isAdminAuthenticated,
    closeTest
);

// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;

