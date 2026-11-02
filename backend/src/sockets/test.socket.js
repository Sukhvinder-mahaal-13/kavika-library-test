const Participant = require("../models/Participant");
const Test = require("../models/Test");

const registerTestSocket = (io) => {

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins the waiting room of a particular test
    socket.on("join-waiting-room", async (testId) => {
        try {
            const test = await Test.findById(testId);

            if (!test) {
                socket.emit("socket-error", {
                    message: "Test not found."
                });
                return;
            }

            if (test.status !== "scheduled") {
                socket.emit("socket-error", {
                    message: "This test is not available in the waiting room."
                });
                return;
            }

            socket.join(`test-${testId}`);

            const totalParticipants = await Participant.countDocuments({
                test: testId
            });

            io.to(`test-${testId}`).emit(
                "participant-count-updated",
                {
                    totalParticipants
                }
            );

            console.log(
                `Socket ${socket.id} joined waiting room: ${testId}`
            );

        } catch (error) {
            console.error("Waiting Room Socket Error:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

console.log("Test Socket Events Registered");


};

module.exports = registerTestSocket;
