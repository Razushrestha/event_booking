const GenRes = require("../../utils/router/GenRes");
const Stall = require("./stall.model");
const Event = require("../event/event.model");
const StallType = require("../stallType/stallType.model");
const fs = require("fs");
const path = require("path");

const getAllStalls = async (req, res) => {
  try {
    const stalls = await Stall.find().populate("stallTypeId");
    return res
      .status(200)
      .json(GenRes(200, stalls, null, "Stalls fetched successfully", req.url));
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

const getStallByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1. Fetch all stall types for the event and build a lookup map
    const stallTypes = await StallType.find({ eventId }).select("typeId name").lean();
    const stallTypeMap = {};
    for (const type of stallTypes) {
      stallTypeMap[type.typeId] = type.name;
    }

    // 2. Fetch stalls for the event
    const stallsRaw = await Stall.find({ eventId })
      .select("stallId name status stallTypeId -_id")
      .lean();

    // 3. Map stalls to include stallTypeName using the map
    const stalls = stallsRaw.map(stall => ({
      stallId: stall.stallId,
      name: stall.name,
      status: stall.status,
      stallTypeName: stallTypeMap[stall.stallTypeId] || null,
    }));

    // 4. Get event details
    const event = await Event.findOne({ eventId }).select("eventId title floorPlan floorPlans");

    if (!stalls || stalls.length === 0) {
      return res.status(200).json(
        GenRes(200, [], null, "No stalls found for this event", req.url)
      );
    }

    // 5. Construct final response
    const stallsResponse = {
      eventId: event?.eventId,
      title: event?.title,
      floorPlan: event?.floorPlan,
      floorPlans: event?.floorPlans,
      stalls: stalls,
    };

    return res.status(200).json(
      GenRes(200, stallsResponse, null, "Stalls fetched successfully", req.url)
    );
  } catch (err) {
    return res.status(500).json(
      GenRes(500, null, err, err?.message, req.url)
    );
  }
};

const getStallById = async (req, res) => {
  try {
    const { stallId } = req.params;

    // Check if stallId contains multiple IDs (separated by comma or pipe)
    const isMultipleIds = stallId.includes(',') || stallId.includes('|');
    let stallIds = [];

    if (isMultipleIds) {
      // Split by comma or pipe and clean up
      stallIds = stallId.split(/[,|]/).map(id => id.trim()).filter(id => id);
    } else {
      stallIds = [stallId];
    }

    // Validate that we have valid stallIds
    if (stallIds.length === 0) {
      return res.status(400).json(
        GenRes(400, null, null, "Invalid stallId format", req.url)
      );
    }

    // Fetch all requested stalls
    const stalls = await Stall.find({ stallId: { $in: stallIds } }).lean();

    if (!stalls || stalls.length === 0) {
      return res.status(404).json(
        GenRes(404, null, null, "No stalls found", req.url)
      );
    }

    // Get all unique stallTypeIds for batch fetching
    const stallTypeIds = [...new Set(stalls.map(stall => stall.stallTypeId))];

    // Fetch all stall types in one query
    const stallTypes = await StallType.find({ typeId: { $in: stallTypeIds } }).lean();

    // Create a map for quick lookup
    const stallTypeMap = {};
    stallTypes.forEach(stallType => {
      stallTypeMap[stallType.typeId] = stallType;
    });

    // Process each stall
    const processedStalls = stalls.map(stall => {
      const stallType = stallTypeMap[stall.stallTypeId];

      if (!stallType) {
        // Log warning but don't fail the entire request
        console.warn(`Stall type not found for stallId: ${stall.stallId}, stallTypeId: ${stall.stallTypeId}`);
      }

      // Prepare final object
      const {
        typeId, // remove
        eventId: stallTypeEventId, // remove repeated
        name: stallTypeName,
        __v, // remove
        ...restStallTypeFields
      } = stallType || {};

      const {
        stallTypeId, // remove
        __v: stallV, // remove
        ...restStallFields
      } = stall;

      return {
        ...restStallFields,
        stallTypeName: stallTypeName || null,
        ...restStallTypeFields,
      };
    });

    // Check for missing stalls
    const foundStallIds = stalls.map(stall => stall.stallId);
    const missingStallIds = stallIds.filter(id => !foundStallIds.includes(id));

    // Return appropriate response format
    if (stallIds.length === 1) {
      // Single stall request - return single object
      if (processedStalls.length === 0) {
        return res.status(404).json(
          GenRes(404, null, null, "Stall not found", req.url)
        );
      }

      return res.status(200).json(
        GenRes(200, processedStalls[0], null, "Stall fetched successfully", req.url)
      );
    } else {
      // Multiple stalls request - return array with metadata
      const response = processedStalls

      return res.status(200).json(
        GenRes(200, response, null, `${processedStalls.length} stalls fetched successfully`, req.url)
      );
    }

  } catch (err) {
    console.error('Error in getStallById:', err);
    return res.status(500).json(
      GenRes(500, null, err, err?.message || "Failed to fetch stall(s)", req.url)
    );
  }
};

const createStall = async (req, res) => {
  try {
    const { name, stallTypeId } = req.body;

    if (!name || !stallTypeId) {
      return res
        .status(400)
        .json(GenRes(400, null, null, "Missing required fields", req.url));
    }

    // Verify stall type exists
    const stallType = await StallType.findOne({ typeId: stallTypeId });
    if (!stallType) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Stall type not found", req.url));
    }

    //check if stall with same name already exists for the event
    const existingStall = await Stall.findOne({
      name,
      eventId: stallType.eventId,
      stallTypeId,
    });
    if (existingStall) {
      return res
        .status(400)
        .json(
          GenRes(400, null, null, "Stall with this name already exists", req.url)
        );
    }

    let images = [];
    if (req.files?.images) {
      const uploadsDir = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "uploads",
        "stalls"
      );
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      images = req.files.images.map((file) => {
        const fileName = `${Date.now()}_${file.originalname}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        return `/uploads/stalls/${fileName}`;
      });
    }

    const newStall = new Stall({
      name,
      eventId: stallType.eventId,
      stallTypeId,
      images,
      status: "available",
    });

    await newStall.save();
    return res
      .status(201)
      .json(GenRes(201, newStall, null, "Stall created successfully", req.url));
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

const createMultipleStalls = async (req, res) => {
  try {
    const { name, stallTypeId } = req.body

    if (!name || !stallTypeId) {
      return res
        .status(400)
        .json(GenRes(400, null, null, "Missing required fields", req.url))
    }

    // Validate stallType
    const stallType = await StallType.findOne({ typeId: stallTypeId })
    if (!stallType) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Stall type not found", req.url))
    }

    // Split names by comma and trim
    const stallNames = name
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)

    if (stallNames.length === 0) {
      return res
        .status(400)
        .json(
          GenRes(400, null, null, "No valid stall names provided", req.url)
        )
    }

    // Check for duplicates in DB for same event & location
    const existingStalls = await Stall.find({
      name: { $in: stallNames },
      eventId: stallType.eventId,
      "location.name": stallType.location.name, // assuming stallType.location has a `name` property
    })

    if (existingStalls.length > 0) {
      const duplicateNames = existingStalls.map((s) => s.name).join(", ")
      return res.status(400).json(
        GenRes(
          400,
          null,
          null,
          `Stall(s) already exist at this location: ${duplicateNames}`,
          req.url
        )
      )
    }

    // Handle optional image uploads
    let images = []
    if (req.files?.images) {
      const uploadsDir = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "uploads",
        "stalls"
      )
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      images = req.files.images.map((file) => {
        const fileName = `${Date.now()}_${file.originalname}`
        const filePath = path.join(uploadsDir, fileName)
        fs.writeFileSync(filePath, file.buffer)
        return `/uploads/stalls/${fileName}`
      })
    }

    // Build new stall docs
    const newStalls = stallNames.map((stallName) => ({
      name: stallName,
      eventId: stallType.eventId,
      stallTypeId: stallType.typeId,
      location: stallType.location,
      images,
      status: "available",
    }))

    const insertedStalls = await Stall.insertMany(newStalls)

    return res
      .status(201)
      .json(
        GenRes(201, insertedStalls, null, "Stalls created successfully", req.url)
      )
  } catch (err) {
    return res
      .status(500)
      .json(GenRes(500, null, err, err?.message, req.url))
  }
}
const updateStall = async (req, res) => {
  try {
    const { stallId } = req.params;
    const updateData = req.body;

    // Check if stall exists and is available
    const stall = await Stall.findOne({ stallId });
    if (!stall) {
      return res.status(404).json(GenRes(404, null, null, "Stall not found", req.url));
    }
    if (stall.status !== "available") {
      return res
        .status(403)
        .json(GenRes(403, null, null, "Cannot update stall: not available", req.url));
    }

    // If updating stall name, check for uniqueness
    if (updateData.name && updateData.name !== stall.name) {
      const existingStall = await Stall.findOne({ name: updateData.name });
      if (existingStall) {
        return res
          .status(400)
          .json(GenRes(400, null, null, "Stall name already exists", req.url));
      }
    }

    // If updating stall type, verify it exists
    if (updateData.stallTypeId) {
      const stallType = await StallType.findOne({
        typeId: updateData.stallTypeId,
      });
      if (!stallType) {
        return res
          .status(404)
          .json(GenRes(404, null, null, "Stall type not found", req.url));
      }
    }

    if (req.files?.images) {
      const uploadsDir = path.join(__dirname, "..", "..", "uploads", "stalls");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const images = Array.isArray(req.files.images)
        ? req.files.images.map((file) => {
          const fileName = `${Date.now()}_${file.originalname}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, file.buffer);
          return `/uploads/stalls/${fileName}`;
        })
        : [req.files.images].map((file) => {
          const fileName = `${Date.now()}_${file.originalname}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, file.buffer);
          return `/uploads/stalls/${fileName}`;
        });

      updateData.images = images;
    }

    const updatedStall = await Stall.findOneAndUpdate({ stallId }, updateData, {
      new: true,
    }).populate("stallTypeId");

    return res
      .status(200)
      .json(GenRes(200, updatedStall, null, "Stall updated successfully", req.url));
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err.message, req.url));
  }
};

const deleteStall = async (req, res) => {
  try {
    const { stallId } = req.params;

    // Check if stall exists and is available
    const stall = await Stall.findOne({ stallId });
    if (!stall) {
      return res.status(404).json(GenRes(404, null, null, "Stall not found", req.url));
    }
    if (stall.status !== "available") {
      return res
        .status(403)
        .json(GenRes(403, null, null, "Cannot delete stall: not available", req.url));
    }

    // Delete stall
    const deletedStall = await Stall.findOneAndDelete({ stallId });

    // Delete associated images
    if (deletedStall.images && deletedStall.images.length > 0) {
      deletedStall.images.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "..", "..", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    return res
      .status(200)
      .json(GenRes(200, null, null, "Stall deleted successfully", req.url));
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err.message, req.url));
  }
};

const getAvailableStalls = async (req, res) => {
  try {
    const stalls = await Stall.find({
      status: "available",
      expiryDate: { $gt: new Date() },
    }).populate("stallTypeId");

    return res
      .status(200)
      .json(GenRes(200, stalls, null, "Available stalls fetched successfully", req.url));
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err.message, req.url));
  }
};



module.exports = {
  getAllStalls,
  getStallById,
  getStallByEventId,
  createStall,
  updateStall,
  deleteStall,
  createMultipleStalls,
  getAvailableStalls,
};
