require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const User = require("../src/modules/user/user.model");
const Organization = require("../src/modules/organization/organization.model");
const Event = require("../src/modules/event/event.model");
const Ticket = require("../src/modules/ticket/ticket.model");
const Booking = require("../src/modules/booking/booking.model");
const Service = require("../src/modules/service/service.model");
const PaymentMethod = require("../src/modules/payment-method/paymentMethod.model");
const TeamMember = require("../src/modules/team/team.model");
const Contact = require("../src/modules/contact/contact.model");
const PrintingState = require("../src/modules/print/printState.model");
const PrintedTicket = require("../src/modules/print/printedTicket.model");
const Discount = require("../src/modules/discount/discount.model");
const StallType = require("../src/modules/stallType/stallType.model");
const Stall = require("../src/modules/stall/stall.model");

const PASSWORD = "Admin@123";

const ids = {
  users: {
    admin: uuidv4(),
    organization: uuidv4(),
    employee: uuidv4(),
    user: uuidv4(),
    user2: uuidv4(),
    user3: uuidv4(),
  },
  events: {
    ongoing: uuidv4(),
    festival: uuidv4(),
    tech: uuidv4(),
    concert: uuidv4(),
    past: uuidv4(),
    external: uuidv4(),
  },
  stallTypes: {
    standard: uuidv4(),
    premium: uuidv4(),
    corner: uuidv4(),
  },
  stalls: {
    a01: uuidv4(),
    a02: uuidv4(),
    a03: uuidv4(),
    b01: uuidv4(),
    b02: uuidv4(),
    c01: uuidv4(),
    c02: uuidv4(),
    c03: uuidv4(),
  },
  bookings: {
    hold: uuidv4(),
    pending: uuidv4(),
    confirmed: uuidv4(),
    paid: uuidv4(),
    cancelled: uuidv4(),
    completed: uuidv4(),
  },
  tickets: {
    pending1: uuidv4(),
    pending2: uuidv4(),
    pending3: uuidv4(),
    approved1: uuidv4(),
    approved2: uuidv4(),
    rejected1: uuidv4(),
  },
  payments: {
    p1: uuidv4(),
    p2: uuidv4(),
    p3: uuidv4(),
    p4: uuidv4(),
  },
};

const COLLECTIONS = [
  "users",
  "organizations",
  "events",
  "tickets",
  "bookings",
  "services",
  "paymentmethods",
  "teammembers",
  "contacts",
  "printingstates",
  "printedtickets",
  "discounts",
  "stalltypes",
  "stalls",
];

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function daysAgo(days) {
  return daysFromNow(-days);
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function clearDatabase() {
  const db = mongoose.connection.db;
  const existing = await db.listCollections().toArray();

  for (const collection of existing) {
    await db.collection(collection.name).deleteMany({});
  }
}

function buildUsers(passwordHash) {
  return [
    {
      userId: ids.users.admin,
      name: "EventSolution Admin",
      email: "admin@eventsolution.com.np",
      phone: "9801000001",
      passwordHash,
      role: "admin",
      isVerified: true,
    },
    {
      userId: ids.users.organization,
      name: "EventSolution Nepal Pvt. Ltd.",
      email: "org@eventsolution.com.np",
      phone: "9801000002",
      passwordHash,
      role: "organization",
      isVerified: true,
      organizationDetails: {
        address: "Bhrikutimandap, Kathmandu, Nepal",
        vatNumber: "606263456",
        panNumber: "606263456",
        contactPerson: {
          name: "Raju Sharma",
          phone: "015260535",
          email: "info@eventsolution.com.np",
        },
      },
    },
    {
      userId: ids.users.employee,
      name: "Sita Gurung",
      email: "employee@eventsolution.com.np",
      phone: "9801000003",
      passwordHash,
      role: "employee",
      isVerified: true,
    },
    {
      userId: ids.users.user,
      name: "Anil Karki",
      email: "user@eventsolution.com.np",
      phone: "9801000004",
      passwordHash,
      role: "user",
      isVerified: true,
    },
    {
      userId: ids.users.user2,
      name: "Priya Thapa",
      email: "priya@example.com",
      phone: "9801000005",
      passwordHash,
      role: "user",
      isVerified: true,
    },
    {
      userId: ids.users.user3,
      name: "Bikash Rai",
      email: "bikash@example.com",
      phone: "9801000006",
      passwordHash,
      role: "user",
      isVerified: true,
    },
  ];
}

function buildEvents() {
  const now = new Date();

  return [
    {
      eventId: ids.events.ongoing,
      title: "Kathmandu Trade Expo 2026",
      description:
        "Nepal's largest B2B trade exhibition featuring local manufacturers, exporters, and international buyers.",
      location: "Bhrikutimandap Exhibition Hall, Kathmandu",
      googleMapUrl: "https://maps.google.com/?q=Bhrikutimandap+Kathmandu",
      organizer: "EventSolution Nepal",
      managedBy: "EventSolution Nepal",
      public: true,
      ownEvent: true,
      startDateTime: daysAgo(1),
      endDateTime: daysFromNow(2),
      scheduleStart: "10:00",
      scheduleEnd: "18:00",
      registrationOpen: daysAgo(30),
      registrationClose: daysFromNow(1),
      entryType: "paid",
      eventType: "Exhibition",
      poster: "https://images.unsplash.com/photo-1560185127-978bd788bfed?w=1200&auto=format&fit=crop",
      hasStalls: true,
      holdExpiryPeriod: 2,
      minimumPaymentPercent: 30,
      ticketNeedsAttendeeImage: false,
      termsAndConditions:
        "All exhibitors must comply with venue safety regulations. Stall allocation is subject to payment confirmation.",
      ticketTiers: [
        {
          name: "Visitor Pass",
          price: 300,
          listOfFeatures: ["Hall access", "Exhibitor directory"],
        },
        {
          name: "Business Pass",
          price: 1200,
          listOfFeatures: ["Priority entry", "Networking lounge", "Catalogue"],
        },
      ],
    },
    {
      eventId: ids.events.festival,
      title: "Nepal Food & Culture Festival 2026",
      description:
        "Celebrate Nepal's culinary diversity with food stalls, live music, cultural dance, and artisan markets.",
      location: "Tundikhel Ground, Kathmandu",
      googleMapUrl: "https://maps.google.com/?q=Tundikhel+Kathmandu",
      organizer: "EventSolution Nepal",
      managedBy: "EventSolution Nepal",
      public: true,
      ownEvent: true,
      startDateTime: daysFromNow(7),
      endDateTime: daysFromNow(9),
      scheduleStart: "11:00",
      scheduleEnd: "21:00",
      registrationOpen: now,
      registrationClose: daysFromNow(6),
      entryType: "paid",
      eventType: "Festival",
      poster: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop",
      hasStalls: true,
      holdExpiryPeriod: 2,
      minimumPaymentPercent: 25,
      ticketNeedsAttendeeImage: false,
      termsAndConditions:
        "Outside food and beverages are not permitted. Children under 5 enter free with a guardian.",
      ticketTiers: [
        {
          name: "General Admission",
          price: 500,
          listOfFeatures: ["Food court access", "Cultural performances"],
        },
        {
          name: "VIP Experience",
          price: 2000,
          listOfFeatures: ["VIP seating", "Tasting pass", "Meet the chefs"],
        },
      ],
    },
    {
      eventId: ids.events.tech,
      title: "Tech Innovation Summit Nepal",
      description:
        "Connect with founders, investors, and policymakers driving Nepal's digital transformation.",
      location: "Soaltee Crowne Plaza, Tahachal, Kathmandu",
      googleMapUrl: "https://maps.google.com/?q=Soaltee+Crowne+Plaza+Kathmandu",
      organizer: "EventSolution Nepal",
      managedBy: "EventSolution Nepal",
      public: true,
      ownEvent: true,
      startDateTime: daysFromNow(21),
      endDateTime: daysFromNow(22),
      scheduleStart: "09:00",
      scheduleEnd: "17:30",
      registrationOpen: now,
      registrationClose: daysFromNow(20),
      entryType: "paid",
      eventType: "Conference",
      poster: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop",
      hasStalls: false,
      ticketNeedsAttendeeImage: true,
      termsAndConditions:
        "Recording of keynote sessions is prohibited without written consent from organizers.",
      ticketTiers: [
        {
          name: "Standard Delegate",
          price: 3500,
          listOfFeatures: ["All sessions", "Lunch", "Certificate"],
        },
        {
          name: "Premium Delegate",
          price: 6500,
          listOfFeatures: ["Front-row seating", "Workshop access", "Investor meetup"],
        },
      ],
    },
    {
      eventId: ids.events.concert,
      title: "Himalayan Live Music Night",
      description:
        "An open-air concert featuring Nepal's top rock and folk artists under the Kathmandu skyline.",
      location: "Purple Haze Rock Bar, Thamel, Kathmandu",
      googleMapUrl: "https://maps.google.com/?q=Purple+Haze+Thamel",
      organizer: "EventSolution Nepal",
      managedBy: "EventSolution Nepal",
      public: true,
      ownEvent: true,
      startDateTime: daysFromNow(35),
      endDateTime: daysFromNow(35),
      scheduleStart: "17:00",
      scheduleEnd: "23:00",
      registrationOpen: now,
      registrationClose: daysFromNow(34),
      entryType: "paid",
      eventType: "Concert",
      poster: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&auto=format&fit=crop",
      hasStalls: false,
      termsAndConditions: "Valid government ID required for entry. Re-entry is not permitted.",
      ticketTiers: [
        {
          name: "Standing",
          price: 800,
          listOfFeatures: ["General admission"],
        },
        {
          name: "Reserved Seating",
          price: 1500,
          listOfFeatures: ["Numbered seat", "Early entry"],
        },
      ],
    },
    {
      eventId: ids.events.past,
      title: "Community Health & Wellness Camp 2026",
      description:
        "Free health screenings, dental checkups, and wellness workshops for the Kathmandu community.",
      location: "Patan Durbar Square, Lalitpur",
      googleMapUrl: "https://maps.google.com/?q=Patan+Durbar+Square",
      organizer: "EventSolution Nepal",
      managedBy: "Nepal Health Alliance",
      public: true,
      ownEvent: true,
      startDateTime: daysAgo(40),
      endDateTime: daysAgo(40),
      scheduleStart: "08:00",
      scheduleEnd: "16:00",
      registrationOpen: daysAgo(60),
      registrationClose: daysAgo(41),
      entryType: "free",
      eventType: "Community",
      poster: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop",
      hasStalls: false,
      termsAndConditions: "First-come, first-served for screening slots.",
    },
    {
      eventId: ids.events.external,
      title: "International Yoga Retreat",
      description:
        "A partner-hosted wellness retreat led by certified international instructors.",
      location: "Nagarkot Hill Station, Bhaktapur",
      googleMapUrl: "https://maps.google.com/?q=Nagarkot+Nepal",
      organizer: "Wellness Partners International",
      managedBy: "Wellness Partners International",
      public: true,
      ownEvent: false,
      startDateTime: daysFromNow(14),
      endDateTime: daysFromNow(16),
      scheduleStart: "06:00",
      scheduleEnd: "20:00",
      registrationOpen: now,
      registrationClose: daysFromNow(13),
      entryType: "paid",
      eventType: "Wellness",
      poster: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop",
      hasStalls: false,
      externalLink: "http://example.com/yoga-retreat",
      ticketTiers: [
        {
          name: "Day Pass",
          price: 2500,
          listOfFeatures: ["All sessions", "Meals included"],
        },
      ],
    },
  ];
}

function buildStallTypes() {
  return [
    {
      typeId: ids.stallTypes.standard,
      eventId: ids.events.ongoing,
      name: "Trade Expo Standard Booth",
      sizeInSqFt: 80,
      size: "8x10 ft",
      rate: 12000,
      location: "Hall A - Ground Floor",
      amenities: ["Table", "Chairs", "Power outlet", "Wi-Fi"],
    },
    {
      typeId: ids.stallTypes.premium,
      eventId: ids.events.ongoing,
      name: "Trade Expo Premium Booth",
      sizeInSqFt: 120,
      size: "10x12 ft",
      upchargeInPercent: 15,
      rate: 20000,
      location: "Hall B - Premium Zone",
      amenities: ["Branding panel", "Extra lighting", "Storage locker", "Wi-Fi"],
    },
    {
      typeId: ids.stallTypes.corner,
      eventId: ids.events.festival,
      name: "Food Festival Corner Stall",
      sizeInSqFt: 100,
      size: "10x10 ft",
      upchargeInPercent: 20,
      rate: 18000,
      location: "Food Court - Corner Row",
      amenities: ["Gas connection", "Water supply", "Waste disposal"],
    },
  ];
}

function buildStalls() {
  return [
    { stallId: ids.stalls.a01, eventId: ids.events.ongoing, name: "A-01", stallTypeId: ids.stallTypes.standard, status: "booked" },
    { stallId: ids.stalls.a02, eventId: ids.events.ongoing, name: "A-02", stallTypeId: ids.stallTypes.standard, status: "booked" },
    { stallId: ids.stalls.a03, eventId: ids.events.ongoing, name: "A-03", stallTypeId: ids.stallTypes.standard, status: "hold" },
    { stallId: ids.stalls.b01, eventId: ids.events.ongoing, name: "B-01", stallTypeId: ids.stallTypes.premium, status: "available" },
    { stallId: ids.stalls.b02, eventId: ids.events.ongoing, name: "B-02", stallTypeId: ids.stallTypes.premium, status: "available" },
    { stallId: ids.stalls.c01, eventId: ids.events.festival, name: "FC-01", stallTypeId: ids.stallTypes.corner, status: "available" },
    { stallId: ids.stalls.c02, eventId: ids.events.festival, name: "FC-02", stallTypeId: ids.stallTypes.corner, status: "available" },
    { stallId: ids.stalls.c03, eventId: ids.events.festival, name: "FC-03", stallTypeId: ids.stallTypes.corner, status: "available" },
  ];
}

function buildTickets() {
  return [
    {
      ticketId: ids.tickets.pending1,
      eventId: ids.events.tech,
      eventName: "Tech Innovation Summit Nepal",
      userId: ids.users.user,
      name: "Anil Karki",
      email: "user@eventsolution.com.np",
      number: "9801000004",
      status: "pending",
      ticketInfo: {
        tierName: "Standard Delegate",
        price: 3500,
        features: [
          { name: "All sessions", status: false },
          { name: "Lunch", status: false },
          { name: "Certificate", status: false },
        ],
      },
      submittedAt: daysAgo(2),
    },
    {
      ticketId: ids.tickets.pending2,
      eventId: ids.events.concert,
      eventName: "Himalayan Live Music Night",
      userId: ids.users.user2,
      name: "Priya Thapa",
      email: "priya@example.com",
      number: "9801000005",
      status: "pending",
      ticketInfo: {
        tierName: "Reserved Seating",
        price: 1500,
        features: [
          { name: "Numbered seat", status: false },
          { name: "Early entry", status: false },
        ],
      },
      submittedAt: daysAgo(1),
    },
    {
      ticketId: ids.tickets.pending3,
      eventId: ids.events.festival,
      eventName: "Nepal Food & Culture Festival 2026",
      userId: ids.users.user3,
      name: "Bikash Rai",
      email: "bikash@example.com",
      number: "9801000006",
      status: "pending",
      ticketInfo: {
        tierName: "General Admission",
        price: 500,
        features: [
          { name: "Food court access", status: false },
          { name: "Cultural performances", status: false },
        ],
      },
      submittedAt: daysAgo(0),
    },
    {
      ticketId: ids.tickets.approved1,
      eventId: ids.events.festival,
      eventName: "Nepal Food & Culture Festival 2026",
      userId: ids.users.user,
      name: "Anil Karki",
      email: "user@eventsolution.com.np",
      number: "9801000004",
      status: "approved",
      qr: "/uploads/qr/ticket-approved-1.png",
      ticketInfo: {
        tierName: "VIP Experience",
        price: 2000,
        features: [
          { name: "VIP seating", status: true },
          { name: "Tasting pass", status: true },
          { name: "Meet the chefs", status: true },
        ],
      },
      submittedAt: daysAgo(5),
    },
    {
      ticketId: ids.tickets.approved2,
      eventId: ids.events.ongoing,
      eventName: "Kathmandu Trade Expo 2026",
      userId: ids.users.user2,
      name: "Priya Thapa",
      email: "priya@example.com",
      number: "9801000005",
      status: "approved",
      qr: "/uploads/qr/ticket-approved-2.png",
      ticketInfo: {
        tierName: "Business Pass",
        price: 1200,
        features: [
          { name: "Priority entry", status: true },
          { name: "Networking lounge", status: true },
          { name: "Catalogue", status: true },
        ],
      },
      submittedAt: daysAgo(7),
    },
    {
      ticketId: ids.tickets.rejected1,
      eventId: ids.events.tech,
      eventName: "Tech Innovation Summit Nepal",
      userId: ids.users.user3,
      name: "Bikash Rai",
      email: "bikash@example.com",
      number: "9801000006",
      status: "rejected",
      note: "Payment screenshot was unclear. Please re-register with a valid proof of payment.",
      ticketInfo: {
        tierName: "Premium Delegate",
        price: 6500,
        features: [
          { name: "Front-row seating", status: false },
          { name: "Workshop access", status: false },
          { name: "Investor meetup", status: false },
        ],
      },
      submittedAt: daysAgo(4),
    },
  ];
}

function buildBookings() {
  const holdExpiry = daysFromNow(1);

  return [
    {
      bookingId: ids.bookings.hold,
      eventId: ids.events.ongoing,
      eventName: "Kathmandu Trade Expo 2026",
      userId: ids.users.organization,
      isHold: true,
      holdExpiry,
      totalAmount: 12000,
      pendingAmount: 12000,
      paymentStatus: "unpaid",
      status: "pending",
      businessInfo: {
        name: "EventSolution Nepal Pvt. Ltd.",
        phone: "9801000002",
        email: "org@eventsolution.com.np",
      },
      contactPerson: {
        name: "Raju Sharma",
        phone: "015260535",
        email: "info@eventsolution.com.np",
      },
      stallInfo: [
        {
          stallId: ids.stalls.a03,
          stallName: "A-03",
          stallType: "Trade Expo Standard Booth",
          rate: 12000,
          sizeInSqFt: 80,
          upchargeInPercent: 0,
        },
      ],
      payments: [],
      createdAt: daysAgo(0),
    },
    {
      bookingId: ids.bookings.pending,
      eventId: ids.events.ongoing,
      eventName: "Kathmandu Trade Expo 2026",
      userId: ids.users.organization,
      isHold: false,
      totalAmount: 12000,
      pendingAmount: 8400,
      paymentStatus: "remaining",
      status: "pending",
      businessInfo: {
        name: "EventSolution Nepal Pvt. Ltd.",
        phone: "9801000002",
        email: "org@eventsolution.com.np",
      },
      contactPerson: {
        name: "Raju Sharma",
        phone: "015260535",
        email: "info@eventsolution.com.np",
      },
      stallInfo: [
        {
          stallId: ids.stalls.a01,
          stallName: "A-01",
          stallType: "Trade Expo Standard Booth",
          rate: 12000,
          sizeInSqFt: 80,
          upchargeInPercent: 0,
        },
      ],
      paymentProof: ["/uploads/payments/partial-payment-1.png"],
      payments: [
        {
          paymentId: ids.payments.p1,
          amount: 3600,
          paymentDate: daysAgo(3),
          paymentProof: "/uploads/payments/partial-payment-1.png",
          paymentMethod: "eSewa",
          status: "pending",
        },
      ],
      createdAt: daysAgo(5),
    },
    {
      bookingId: ids.bookings.confirmed,
      eventId: ids.events.ongoing,
      eventName: "Kathmandu Trade Expo 2026",
      userId: ids.users.user,
      isHold: false,
      totalAmount: 20000,
      pendingAmount: 10000,
      paymentStatus: "remaining",
      status: "confirmed",
      qr: "/uploads/qr/booking-confirmed-1.png",
      businessInfo: {
        name: "Himalayan Crafts Pvt. Ltd.",
        phone: "9801000004",
        email: "user@eventsolution.com.np",
      },
      contactPerson: {
        name: "Anil Karki",
        phone: "9801000004",
        email: "user@eventsolution.com.np",
      },
      stallInfo: [
        {
          stallId: ids.stalls.a02,
          stallName: "A-02",
          stallType: "Trade Expo Standard Booth",
          rate: 12000,
          sizeInSqFt: 80,
          upchargeInPercent: 0,
        },
      ],
      paymentProof: ["/uploads/payments/partial-payment-2.png"],
      payments: [
        {
          paymentId: ids.payments.p2,
          amount: 10000,
          paymentDate: daysAgo(6),
          paymentProof: "/uploads/payments/partial-payment-2.png",
          paymentMethod: "Bank Transfer",
          status: "completed",
        },
      ],
      createdAt: daysAgo(10),
    },
    {
      bookingId: ids.bookings.paid,
      eventId: ids.events.ongoing,
      eventName: "Kathmandu Trade Expo 2026",
      userId: ids.users.user2,
      isHold: false,
      totalAmount: 20000,
      pendingAmount: 0,
      paymentStatus: "paid",
      status: "confirmed",
      qr: "/uploads/qr/booking-paid-1.png",
      businessInfo: {
        name: "Everest Organics",
        phone: "9801000005",
        email: "priya@example.com",
      },
      contactPerson: {
        name: "Priya Thapa",
        phone: "9801000005",
        email: "priya@example.com",
      },
      stallInfo: [
        {
          stallId: ids.stalls.b01,
          stallName: "B-01",
          stallType: "Trade Expo Premium Booth",
          rate: 20000,
          sizeInSqFt: 120,
          upchargeInPercent: 15,
        },
      ],
      paymentProof: ["/uploads/payments/full-payment-1.png"],
      payments: [
        {
          paymentId: ids.payments.p3,
          amount: 20000,
          paymentDate: daysAgo(8),
          paymentProof: "/uploads/payments/full-payment-1.png",
          paymentMethod: "Khalti",
          status: "completed",
        },
      ],
      createdAt: daysAgo(12),
    },
    {
      bookingId: ids.bookings.cancelled,
      eventId: ids.events.festival,
      eventName: "Nepal Food & Culture Festival 2026",
      userId: ids.users.user3,
      isHold: false,
      totalAmount: 18000,
      pendingAmount: 18000,
      paymentStatus: "unpaid",
      status: "cancelled",
      bookingCancelReason: "Vendor withdrew application before payment deadline.",
      businessInfo: {
        name: "Mountain Spice Co.",
        phone: "9801000006",
        email: "bikash@example.com",
      },
      contactPerson: {
        name: "Bikash Rai",
        phone: "9801000006",
        email: "bikash@example.com",
      },
      stallInfo: [
        {
          stallId: ids.stalls.c01,
          stallName: "FC-01",
          stallType: "Food Festival Corner Stall",
          rate: 18000,
          sizeInSqFt: 100,
          upchargeInPercent: 20,
        },
      ],
      payments: [],
      createdAt: daysAgo(15),
    },
    {
      bookingId: ids.bookings.completed,
      eventId: ids.events.past,
      eventName: "Community Health & Wellness Camp 2026",
      userId: ids.users.organization,
      isHold: false,
      totalAmount: 0,
      pendingAmount: 0,
      paymentStatus: "paid",
      status: "completed",
      businessInfo: {
        name: "EventSolution Nepal Pvt. Ltd.",
        phone: "9801000002",
        email: "org@eventsolution.com.np",
      },
      contactPerson: {
        name: "Raju Sharma",
        phone: "015260535",
        email: "info@eventsolution.com.np",
      },
      stallInfo: [],
      payments: [],
      createdAt: daysAgo(45),
    },
  ];
}

async function seedDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

  await clearDatabase();
  console.log("Cleared existing collections");

  const passwordHash = await hashPassword(PASSWORD);

  await User.insertMany(buildUsers(passwordHash));
  console.log("Seeded 6 users");

  await Organization.create({
    organizationId: uuidv4(),
    name: "EventSolution Nepal Pvt. Ltd.",
    address: "Bhrikutimandap, Kathmandu, Nepal",
    passwordHash,
    phone: "015260535",
    companyEmail: "org@eventsolution.com.np",
    representativeName: "Raju Sharma",
    representativeEmail: "info@eventsolution.com.np",
  });
  console.log("Seeded 1 organization record");

  await Event.insertMany(buildEvents());
  console.log("Seeded 6 events (ongoing, upcoming, past, external)");

  await StallType.insertMany(buildStallTypes());
  await Stall.insertMany(buildStalls());
  console.log("Seeded 3 stall types and 8 stalls");

  await Ticket.insertMany(buildTickets());
  console.log("Seeded 6 tickets (pending, approved, rejected)");

  await Booking.insertMany(buildBookings());
  console.log("Seeded 6 bookings (hold, pending, confirmed, paid, cancelled, completed)");

  await Service.insertMany([
    {
      name: "Event Planning & Management",
      description:
        "Full-service planning from concept and budgeting to vendor coordination and on-site execution.",
    },
    {
      name: "Online Ticketing",
      description:
        "Secure ticket sales with tiered pricing, QR validation, and real-time sales dashboards.",
    },
    {
      name: "Stall & Floor Plan Management",
      description:
        "Interactive floor plans, stall inventory, hold periods, and exhibitor booking workflows.",
    },
    {
      name: "Digital Marketing",
      description:
        "Social campaigns, email outreach, poster design, and audience engagement strategies.",
    },
    {
      name: "On-site Registration",
      description:
        "Badge printing, check-in counters, spot registration, and attendee flow management.",
    },
    {
      name: "Payment Processing",
      description:
        "Support for eSewa, Khalti, bank transfers, and manual payment verification by admins.",
    },
  ]);
  console.log("Seeded 6 services");

  await PaymentMethod.insertMany([
    { name: "eSewa" },
    { name: "Khalti" },
    { name: "Bank Transfer" },
    { name: "Cash" },
    { name: "Fonepay" },
  ]);
  console.log("Seeded 5 payment methods");

  await TeamMember.insertMany([
    {
      name: "Raju Sharma",
      position: "Managing Director",
      description:
        "20+ years of experience in event management across Nepal and South Asia.",
      email: "raju@eventsolution.com.np",
      department: "Leadership",
      hierarchyLevel: 1,
      socialLinks: {
        facebook: "https://facebook.com/eventsolutionnepal",
        instagram: "https://instagram.com/eventsolutionnepal",
      },
    },
    {
      name: "Sita Gurung",
      position: "Operations Manager",
      description: "Leads logistics, vendor management, and on-ground event operations.",
      email: "sita@eventsolution.com.np",
      department: "Operations",
      hierarchyLevel: 2,
      socialLinks: {
        facebook: "https://facebook.com/eventsolutionnepal",
        instagram: "https://instagram.com/eventsolutionnepal",
      },
    },
    {
      name: "Anil Karki",
      position: "Technical Lead",
      description: "Architects the ticketing platform, integrations, and print systems.",
      email: "anil@eventsolution.com.np",
      department: "Technology",
      hierarchyLevel: 2,
      socialLinks: {
        facebook: "https://facebook.com/eventsolutionnepal",
      },
    },
    {
      name: "Maya Shrestha",
      position: "Client Relations Manager",
      description: "Manages corporate partnerships and exhibitor relationships.",
      email: "maya@eventsolution.com.np",
      department: "Sales",
      hierarchyLevel: 3,
      socialLinks: {
        instagram: "https://instagram.com/eventsolutionnepal",
      },
    },
  ]);
  console.log("Seeded 4 team members");

  await Contact.insertMany([
    {
      name: "Sunita Adhikari",
      number: "9841234567",
      email: "sunita@example.com",
      message: "I would like to know the pricing for organizing a corporate conference for 200 attendees.",
      createdAt: daysAgo(3),
    },
    {
      name: "Ramesh KC",
      number: "9851122334",
      email: "ramesh@example.com",
      message: "Can you help us with stall booking for the upcoming food festival?",
      createdAt: daysAgo(1),
    },
    {
      name: "Global Events Ltd.",
      number: "0144123456",
      email: "contact@globalevents.com",
      message: "We are interested in a partnership for international trade exhibitions in Nepal.",
      createdAt: daysAgo(0),
    },
  ]);
  console.log("Seeded 3 contact messages");

  await PrintingState.create({ enabled: false });

  await PrintedTicket.insertMany([
    {
      ticketId: ids.tickets.approved1,
      name: "Anil Karki",
      email: "user@eventsolution.com.np",
      eventId: ids.events.festival,
      eventName: "Nepal Food & Culture Festival 2026",
      qr: "/uploads/qr/ticket-approved-1.png",
    },
    {
      ticketId: ids.tickets.approved2,
      name: "Priya Thapa",
      email: "priya@example.com",
      eventId: ids.events.ongoing,
      eventName: "Kathmandu Trade Expo 2026",
      qr: "/uploads/qr/ticket-approved-2.png",
    },
  ]);
  console.log("Seeded printing state and 2 printed ticket records");

  const now = new Date();
  await Discount.insertMany([
    {
      name: "Early Bird — Tickets",
      description: "10% off ticket registrations made 30 days before the event.",
      code: "EARLY10",
      percentage: 10,
      maximumUsage: 200,
      usedCount: 12,
      startDateTime: now,
      endDateTime: daysFromNow(90),
      applicableToEventId: [ids.events.festival, ids.events.tech, ids.events.concert],
      applicableToTickets: true,
      applicableToStalls: false,
    },
    {
      name: "Exhibitor Discount",
      description: "Flat Rs 2,000 off stall bookings at the trade expo.",
      code: "EXPO2000",
      fixedAmount: 2000,
      maximumUsage: 50,
      usedCount: 3,
      startDateTime: now,
      endDateTime: daysFromNow(30),
      applicableToEventId: [ids.events.ongoing, ids.events.festival],
      applicableToTickets: false,
      applicableToStalls: true,
    },
    {
      name: "VIP Bundle",
      description: "15% off VIP tier tickets for the food festival.",
      code: "VIPFEST15",
      percentage: 15,
      maximumUsage: 100,
      usedCount: 0,
      startDateTime: now,
      endDateTime: daysFromNow(60),
      applicableToEventId: [ids.events.festival],
      applicableToTickets: true,
      applicableToStalls: false,
    },
  ]);
  console.log("Seeded 3 discount codes");

  const summary = await Promise.all(
    COLLECTIONS.map(async (name) => {
      try {
        const count = await mongoose.connection.db.collection(name).countDocuments();
        return { name, count };
      } catch {
        return { name, count: 0 };
      }
    })
  );

  console.log("\nDatabase seeded successfully:\n");
  for (const item of summary) {
    if (item.count > 0) {
      console.log(`  ${item.name.padEnd(18)} ${item.count}`);
    }
  }

  console.log("\nCovers all major app screens:");
  console.log("  - Home page (featured + upcoming events)");
  console.log("  - Event search (upcoming / ongoing / past / external)");
  console.log("  - Admin dashboard (metrics, pending tickets, bookings)");
  console.log("  - Ticket dashboard (pending / approved / rejected)");
  console.log("  - Booking dashboard (hold / pending / confirmed / cancelled)");
  console.log("  - Stall setup & booking flows");
  console.log("  - Team, services, contact, payment methods, discounts");

  console.log("\nLogin credentials (password for all accounts):");
  console.log(`  Password: ${PASSWORD}`);
  console.log("  admin@eventsolution.com.np");
  console.log("  org@eventsolution.com.np");
  console.log("  employee@eventsolution.com.np");
  console.log("  user@eventsolution.com.np");
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
