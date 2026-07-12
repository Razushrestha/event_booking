const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const organizationSchema = new mongoose.Schema({
  organizationId: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  passwordHash: { type: String, required: true }, // for internal use, if needed
  phone: { type: String },
  companyEmail: { type: String, required: true, unique: true },
  representativeName: { type: String },
  representativeEmail: { type: String },
  logo: { type: String } // stores the URL of uploaded logo
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
