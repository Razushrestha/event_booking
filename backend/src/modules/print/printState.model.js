const mongoose = require('mongoose');

const PrintingStateSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
});

module.exports = mongoose.model("PrintingState", PrintingStateSchema);