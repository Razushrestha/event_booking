const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const teamSchema = new mongoose.Schema(
    {
        teamId: { type: String, default: uuidv4, unique: true },
        name: { type: String, required: true },
        position: { type: String, required: true }, // e.g., "CEO", "Developer"
        description: { type: String, default: null }, // optional bio/summary
        photo: { type: String, default: null }, // for team member image
        email: { type: String }, // for contact
        department: { type: String, default: null }, // e.g., "Engineering", "Design"
        hierarchyLevel: { type: Number, default: 0 }, // smaller number = higher in org chart
        socialLinks: {
            facebook: { type: String, default: null },
            instagram: { type: String, default: null },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TeamMember", teamSchema);
