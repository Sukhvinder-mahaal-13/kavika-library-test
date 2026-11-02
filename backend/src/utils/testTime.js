
// =====================================
// KAVIKA TEST PERSONAL TIMER UTILITIES
// =====================================

// Get individual student's deadline
const getStudentDeadline = (startedAt, durationMinutes) => {
    if (!startedAt || !durationMinutes) {
        return null;
    }

    const startTime = new Date(startedAt).getTime();

    if (Number.isNaN(startTime)) {
        return null;
    }

    return new Date(
        startTime + Number(durationMinutes) * 60 * 1000
    );
};

// Get remaining time in seconds
const getRemainingSeconds = (deadlineAt) => {
    if (!deadlineAt) {
        return 0;
    }

    const deadline = new Date(deadlineAt).getTime();

    if (Number.isNaN(deadline)) {
        return 0;
    }

    const remainingMilliseconds = deadline - Date.now();

    return Math.max(
        0,
        Math.ceil(remainingMilliseconds / 1000)
    );
};

// Check whether student's personal timer has expired
const isStudentTimerExpired = (deadlineAt) => {
    if (!deadlineAt) {
        return true;
    }

    const deadline = new Date(deadlineAt).getTime();

    if (Number.isNaN(deadline)) {
        return true;
    }

    return Date.now() >= deadline;
};

// Convert seconds into MM:SS format
const formatRemainingTime = (seconds) => {
    const safeSeconds = Math.max(
        0,
        Math.floor(Number(seconds) || 0)
    );

    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
};

// =====================================
// EXPORTS
// =====================================

module.exports = {
    getStudentDeadline,
    getRemainingSeconds,
    isStudentTimerExpired,
    formatRemainingTime,
};

