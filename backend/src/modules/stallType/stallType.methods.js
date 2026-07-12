const GenRes = require("../../utils/router/GenRes");
const StallType = require("./stallType.model");

const getAllStallTypes = async (req, res) => {
  try {
    const types = await StallType.find();
    return res
      .status(200)
      .json(
        GenRes(200, types, null, "Stall types fetched successfully", req.url)
      );
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

const getAllStallTypesByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const types = await StallType.find({ eventId });

    if (types.length === 0) {
      return res
        .status(200)
        .json(
          GenRes(200, [], null," No stall types found for this event", req.url)
        );
    }

    return res
      .status(200)
      .json(
        GenRes(200, types, null, "Stall types fetched successfully", req.url)
      );
  }
  catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
}

const createStallType = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, sizeInSqFt, size, rate, location, amenities, upchargeInPercent } = req.body;

    if (!name || !sizeInSqFt || !size || !rate || !location) {
      return res
        .status(400)
        .json(GenRes(400, null, null, "Missing required fields", req.url));
    }

    const existingType = await StallType.findOne({ name });
    if (existingType) {
      return res
        .status(409)
        .json(GenRes(409, null, null, "Stall type already exists", req.url));
    }

    const newType = new StallType({
      name,
      eventId,
      sizeInSqFt,
      size,
      rate,
      location,
      upchargeInPercent: upchargeInPercent || 0,
      amenities: amenities || [],
    });

    await newType.save();

    return res
      .status(201)
      .json(
        GenRes(201, newType, null, "Stall type created successfully", req.url)
      );
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

const updateStallType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const updateData = req.body;

    const updatedType = await StallType.findOneAndUpdate(
      { typeId },
      updateData,
      { new: true }
    );

    if (!updatedType) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Stall type not found", req.url));
    }

    return res
      .status(200)
      .json(
        GenRes(200, updatedType, null, "Stall type updated successfully", req.url)
      );
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

const deleteStallType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const type = await StallType.findOneAndDelete({ typeId });

    if (!type) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Stall type not found", req.url));
    }

    return res
      .status(200)
      .json(
        GenRes(200, null, null, "Stall type deleted successfully", req.url)
      );
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

module.exports = {
  getAllStallTypes,
  getAllStallTypesByEventId,
  createStallType,
  updateStallType,
  deleteStallType,
};
