const User = require("../user/user.model");
const GenRes = require("../../utils/router/GenRes");

const deleteEmployee = async (req, res) => {
    try{
        const { email } = req.body;

        if (!email) {
            const err = GenRes(
                400,
                null,
                { message: "Missing field: email" },
                "Email is required",
                req.url
            );
            return res.status(err.status).json(err);
        }

        const normalizedEmail = email.toLowerCase();
        const user = await User.findOneAndDelete({ email: normalizedEmail, role: "employee" });

        if (!user) {
            const err = GenRes(
                404,
                null,
                { message: "User not found" },
                "No employee found with this email",
                req.url
            );
            return res.status(err.status).json(err);
        }

        const successResponse = GenRes(
            200,
            user,
            null,
            "Employee deleted successfully",
            req.url
        );
        return res.status(successResponse.status).json(successResponse);
    }
    catch (error) {
        console.error("Error deleting employee:", error);
        const err = GenRes(
            500,
            null,
            { message: "Internal Server Error" },
            "Failed to delete employee",
            req.url
        );
        return res.status(err.status).json(err);
    }
}

module.exports = { deleteEmployee };
