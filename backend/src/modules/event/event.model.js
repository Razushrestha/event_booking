const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ticketTierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  listOfFeatures: [{ type: String }]
}, { _id: false });

const eventSchema = new mongoose.Schema({
  eventId: { type: String, default: uuidv4, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  googleMapUrl: { type: String },
  organizer: { type: String },
  organizerLogo: { type: String },
  managedBy: { type: String },
  managedByLogo: { type: String },
  public: { type: Boolean, default: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date },
  scheduleStart: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true;
        const timeFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeFormat.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)`
    }
  },
  scheduleEnd: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true;
        const timeFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeFormat.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:mm)`
    }
  },
  registrationOpen: { type: Date, default: null },
  registrationClose: { type: Date, default: null },
  poster: { type: String },
  entryType: { type: String, enum: ['paid', 'free'] },
  eventType: { type: String },
  promoImages: [{ type: String }],
  floorPlan: { type: String, default: null },
  floorPlans: [{ type: String }],
  ticketTiers: [ticketTierSchema],
  hasStalls: { type: Boolean, default: false },
  holdExpiryPeriod: { type: Number },
  minimumPaymentPercent: { type: Number },
  proposal: { type: String, default: null },
  ownEvent: { type: Boolean, default: true },
  ticketNeedsAttendeeImage: { type: Boolean, default: false },
  termsAndConditions: { type: String, default: null },
  externalLink: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^https?:\/\/.+/i.test(v);
      },
      message: props => `${props.value} is not a valid URL. Must start with http:// or https://`
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
