const GenRes = require("../../utils/router/GenRes");
const path = require("path");
const fs = require("fs");
const TeamMember = require("./team.model");
const { compressImage } = require('../../utils/compressImages');
const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "team");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


const getAllTeamMembers = async (req, res) => {
    try {
        const teamMembers = await TeamMember.find().sort({ hierarchyLevel: 1 });
        return res.status(200).json(GenRes(200, teamMembers, null, "Team members fetched successfully"), req.url);
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, "Failed to fetch team members"), req.url);
    }
}

const addTeamMember = async (req, res) => {
    try {
        const { name, position, email, description, department, hierarchyLevel, facebook, instagram } = req.body;

        let photoUrl = null;

        if (req.files && req.files.photo) {
            const files = Array.isArray(req.files.photo) ? req.files.photo : [req.files.photo];
            if (files.length > 0) {
                const file = files[0];
                try {
                    const compressionResult = await compressImage(file.buffer, 85, 1080, 1080);

                    const sanitizedName = file.originalname.replace(/\s+/g, '_');
                    const shortRandom = Math.random().toString(36).substring(2, 6);
                    const fileExtension = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                    const fileName = `${Date.now().toString().slice(-8)}_${shortRandom}_${sanitizedName.split('.')[0]}.${fileExtension}`;
                    const filePath = path.join(uploadsDir, fileName);
                    fs.writeFileSync(filePath, compressionResult.buffer);

                    photoUrl = `/uploads/team/${fileName}`;

                    console.log(`Image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes`);

                } catch (compressionError) {
                    console.error("Image compression failed:", compressionError);
                    return res.status(500).json(GenRes(500, null, compressionError, "Failed to process image"), req.url);
                }
            }
        }

        const newMember = new TeamMember({
            name,
            email,
            position,
            description,
            photo: photoUrl,
            department,
            hierarchyLevel,
            socialLinks: {
                facebook: facebook || null,
                instagram: instagram || null,
            }
        });

        await newMember.save();
        return res.status(201).json(GenRes(201, newMember, null, "Team member added successfully"), req.url);

    } catch (err) {
        console.error("Add team member error:", err);
        return res.status(500).json(GenRes(500, null, err, "Failed to add team member"), req.url);
    }
}

const updateTeamMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { name, position, email, description, department, hierarchyLevel, facebook, instagram } = req.body;

        const existingMember = await TeamMember.findOne({ teamId });
        if (!existingMember) {
            return res.status(404).json(GenRes(404, null, null, "Team member not found"), req.url);
        }

        let photoUrl;

        if (req.files && req.files.photo) {
            const files = Array.isArray(req.files.photo) ? req.files.photo : [req.files.photo];
            if (files.length > 0) {
                const file = files[0];
                try {
                    const compressionResult = await compressImage(file.buffer, 85, 1080, 1080);

                    const sanitizedName = file.originalname.replace(/\s+/g, '_');
                    const shortRandom = Math.random().toString(36).substring(2, 6);
                    const fileExtension = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                    const fileName = `${Date.now().toString().slice(-8)}_${shortRandom}_${sanitizedName.split('.')[0]}.${fileExtension}`;
                    const filePath = path.join(uploadsDir, fileName);

                    // Delete old image
                    if (existingMember.photo) {
                        const oldImagePath = path.join(__dirname, '..', '..', '..', existingMember.photo);
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    }

                    fs.writeFileSync(filePath, compressionResult.buffer);
                    photoUrl = `/uploads/team/${fileName}`;

                    console.log(`Image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes`);

                } catch (compressionError) {
                    console.error("Image compression failed:", compressionError);
                    return res.status(500).json(GenRes(500, null, compressionError, "Failed to process image"), req.url);
                }
            }
        }

        const updateData = {
            name,
            email,
            position,
            description,
            department,
            hierarchyLevel,
            socialLinks: {
                facebook: facebook || null,
                instagram: instagram || null,
            },
            ...(photoUrl && { photo: photoUrl })
        };

        const updatedMember = await TeamMember.findOneAndUpdate({ teamId }, updateData, { new: true });

        return res.status(200).json(GenRes(200, updatedMember, null, "Team member updated successfully"), req.url);

    } catch (err) {
        console.error("Update team member error:", err);
        return res.status(500).json(GenRes(500, null, err, "Failed to update team member"), req.url);
    }
}

const deleteTeamMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const deletedMember = await TeamMember.findOneAndDelete({ teamId });
        if (!deletedMember) {
            return res.status(404).json(GenRes(404, null, null, "Team member not found"), req.url);
        }
        return res.status(200).json(GenRes(200, deletedMember, null, "Team member deleted successfully"), req.url);
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, "Failed to delete team member"), req.url);
    }
}

module.exports = {
    getAllTeamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember
};