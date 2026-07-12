const GenRes = require("../../utils/router/GenRes");
const Booking = require("./booking.model");
const Stall = require("../stall/stall.model");
const StallType = require("../stallType/stallType.model");
const Event = require("../event/event.model");
const fs = require("fs");
const path = require("path");

//Method to create booking
const createBooking = async (req, res) => {
  try {
    const {
      stallId,
      businessName,
      businessPhone,
      businessEmail,
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail
    } = req.body;

    const userDetails = req.user; // This comes from the middleware
    // console.log("User Details:", userDetails.userId);
    // console.log(userDetails);

    if (!stallId || !userDetails) {
      return res
        .status(400)
        .json(GenRes(400, false, null, "Missing required fields", req.url));
    }

    // ✅ 1. Check if stall exists and is available
    const stall = await Stall.findOne({ stallId });
    if (!stall) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Stall not found", req.url));
    }

    // ✅ 2. Check for existing hold booking by the same user
    const existingHoldBooking = await Booking.findOne({
      stallId,
      userId: userDetails.userId,
      isHold: true,
      status: "pending"
    });

    // If there's an existing hold booking by the same user, update it
    if (existingHoldBooking) {
      // Check if hold has expired
      if (existingHoldBooking.holdExpiry && new Date() > existingHoldBooking.holdExpiry) {
        // Hold has expired, mark as cancelled and reset stall status
        existingHoldBooking.status = "cancelled";
        existingHoldBooking.isHold = false;
        await existingHoldBooking.save();

        stall.status = "available";
        await stall.save();

        return res
          .status(400)
          .json(GenRes(400, null, null, "Hold period has expired. Please create a new booking.", req.url));
      }

      // Handle payment proof file upload
      let paymentProofArray = existingHoldBooking.paymentProof || [];

      if (req.files?.paymentProof?.[0]) {
        const uploadsDir = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "uploads",
          "payments"
        );

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const file = req.files.paymentProof[0];
        file.originalname = file.originalname.replace(/\s+/g, '_');
        const fileName = `${Date.now()}_${file.originalname}`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, file.buffer);
        paymentProofArray.push(`/uploads/payments/${fileName}`);
      }

      // Update the existing hold booking
      existingHoldBooking.isHold = false;
      existingHoldBooking.holdExpiry = undefined;
      existingHoldBooking.paymentProof = paymentProofArray;
      existingHoldBooking.paymentStatus = paymentProofArray.length > 0 ? "remaining" : "unpaid";
      // Status will be confirmed by admin later, keep as pending if no payment proof
      existingHoldBooking.status = paymentProofArray.length > 0 ? "pending" : "pending";

      await existingHoldBooking.save();

      // Update stall status - keep as hold until admin confirms
      stall.status = "hold";
      await stall.save();

      return res
        .status(200)
        .json(
          GenRes(200, existingHoldBooking, null, "Hold booking updated successfully. Awaiting admin confirmation.", req.url)
        );
    }

    // Check if stall is available for new booking
    if (stall.status !== "available") {
      return res
        .status(400)
        .json(GenRes(400, null, null, "Stall is not available", req.url));
    }

    // ✅ 3. Get the StallType for price
    const stallType = await StallType.findOne({
      typeId: stall.stallTypeId,
      eventId: stall.eventId,
    });

    if (!stallType) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Stall type not found", req.url));
    }

    // ✅ 4. Get Event for date range
    const event = await Event.findOne({ eventId: stall.eventId });
    if (!event) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Event not found", req.url));
    }

    // ✅ 5. Handle business information priority: req.body -> user data -> error
    let finalBusinessName, finalBusinessPhone, finalBusinessEmail;
    let finalContactPersonName, finalContactPersonPhone, finalContactPersonEmail;

    // Check if business info provided in request body
    if (businessName && businessPhone && businessEmail) {
      finalBusinessName = businessName;
      finalBusinessPhone = businessPhone;
      finalBusinessEmail = businessEmail;
      finalContactPersonName = contactPersonName || businessName;
      finalContactPersonPhone = contactPersonPhone || businessPhone;
      finalContactPersonEmail = contactPersonEmail || businessEmail;
    } else {
      // Fallback to user's organization details
      const user = await User.findOne({ userId: userDetails.userId });

      if (user && user.organizationDetails) {
        const orgDetails = user.organizationDetails;
        finalBusinessName = user.name || orgDetails.name;
        finalBusinessPhone = user.phone || orgDetails.contactPerson?.phone;
        finalBusinessEmail = user.email || orgDetails.contactPerson?.email;
        finalContactPersonName = orgDetails.contactPerson?.name || user.name;
        finalContactPersonPhone = orgDetails.contactPerson?.phone || user.phone;
        finalContactPersonEmail = orgDetails.contactPerson?.email || user.email;
      }

      // If still missing required business info, return error
      if (!finalBusinessName || !finalBusinessPhone || !finalBusinessEmail) {
        return res
          .status(400)
          .json(GenRes(400, null, null, "Please provide business details (businessName, businessPhone, businessEmail)", req.url));
      }
    }

    const totalAmount = stallType.rate * stallType.sizeInSqFt;
    let paymentProofArray = [];

    // ✅ 6. Handle payment proof file upload
    if (req.files?.paymentProof?.[0]) {
      const uploadsDir = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "uploads",
        "payments"
      );

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const file = req.files.paymentProof[0];
      file.originalname = file.originalname.replace(/\s+/g, '_');
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, file.buffer);
      paymentProofArray.push(`/uploads/payments/${fileName}`);
    }

    // ✅ 7. Create new Booking
    const newBooking = new Booking({
      eventId: stall.eventId,
      stallId,
      userId: userDetails.userId,
      totalAmount,
      paymentProof: paymentProofArray,
      businessInfo: {
        name: finalBusinessName,
        phone: finalBusinessPhone,
        email: finalBusinessEmail,
      },
      contactPerson: {
        name: finalContactPersonName,
        phone: finalContactPersonPhone,
        email: finalContactPersonEmail,
      },
      // Set payment status based on whether payment proof was provided
      paymentStatus: paymentProofArray.length > 0 ? "remaining" : "unpaid",
      status: "pending", // Always pending until admin confirms
      isHold: false
    });

    await newBooking.save();

    // ✅ 8. Update stall status to hold (admin will change to booked after confirmation)
    stall.status = "hold";
    await stall.save();

    return res
      .status(201)
      .json(
        GenRes(201, newBooking, null, "Booking created successfully", req.url)
      );

  } catch (err) {
    console.error("Booking creation error:", err);
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

const holdStall = async (req, res) => {
  // console.log("Hold Stall Request Body:", req.body);
  try {
    const {
      stallId,
      businessName,
      businessPhone,
      businessEmail,
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail
    } = req.body;

    const userDetails = req.user; // This comes from the middleware

    if (!stallId || !userDetails) {
      return res
        .status(400)
        .json(GenRes(400, false, null, "Missing required fields", req.url));
    }

    // Check if stall exists and is available
    const stall = await Stall.findOne({ stallId });
    if (!stall) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Stall not found", req.url));
    }

    if (stall.status !== "available") {
      return res
        .status(400)
        .json(GenRes(400, null, null, "Stall is not available for hold", req.url));
    }

    // Get the StallType for price calculation
    const stallType = await StallType.findOne({
      typeId: stall.stallTypeId,
      eventId: stall.eventId,
    });

    if (!stallType) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Stall type not found", req.url));
    }

    // Calculate total amount
    const totalAmount = stallType.rate * stallType.sizeInSqFt;

    // Handle business information priority: req.body -> user data -> error
    let finalBusinessName, finalBusinessPhone, finalBusinessEmail;
    let finalContactPersonName, finalContactPersonPhone, finalContactPersonEmail;

    // Check if business info provided in request body
    if (businessName && businessPhone && businessEmail) {
      finalBusinessName = businessName;
      finalBusinessPhone = businessPhone;
      finalBusinessEmail = businessEmail;
      finalContactPersonName = contactPersonName || businessName;
      finalContactPersonPhone = contactPersonPhone || businessPhone;
      finalContactPersonEmail = contactPersonEmail || businessEmail;
    } else {
      // Fallback to user's organization details
      const user = await User.findOne({ userId: userDetails.userId });

      if (user && user.organizationDetails) {
        const orgDetails = user.organizationDetails;
        finalBusinessName = user.name || orgDetails.name;
        finalBusinessPhone = user.phone || orgDetails.contactPerson?.phone;
        finalBusinessEmail = user.email || orgDetails.contactPerson?.email;
        finalContactPersonName = orgDetails.contactPerson?.name || user.name;
        finalContactPersonPhone = orgDetails.contactPerson?.phone || user.phone;
        finalContactPersonEmail = orgDetails.contactPerson?.email || user.email;
      }

      // If still missing required business info, return error
      if (!finalBusinessName || !finalBusinessPhone || !finalBusinessEmail) {
        return res
          .status(400)
          .json(GenRes(400, null, null, "Please provide business details (businessName, businessPhone, businessEmail)", req.url));
      }
    }

    // Check if user already has a hold on this stall
    const existingHold = await Booking.findOne({
      stallId,
      userId: userDetails.userId,
      isHold: true,
      status: "pending"
    });

    if (existingHold) {
      // Extend the hold period by 3 days from now
      existingHold.holdExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      await existingHold.save();

      return res
        .status(200)
        .json(GenRes(200, existingHold, null, "Hold period extended successfully", req.url));
    }

    // Create new hold booking
    const holdExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    const holdBooking = new Booking({
      eventId: stall.eventId,
      stallId,
      userId: userDetails.userId,
      totalAmount,
      isHold: true,
      holdExpiry,
      paymentStatus: "unpaid",
      status: "pending",
      paymentProof: [],
      businessInfo: {
        name: finalBusinessName,
        phone: finalBusinessPhone,
        email: finalBusinessEmail,
      },
      contactPerson: {
        name: finalContactPersonName,
        phone: finalContactPersonPhone,
        email: finalContactPersonEmail,
      }
    });

    await holdBooking.save();

    // Update stall status to hold
    stall.status = "hold";
    await stall.save();

    return res
      .status(201)
      .json(GenRes(201, holdBooking, null, "Stall held successfully for 3 days", req.url));

  } catch (error) {
    console.error("Hold stall error:", error);
    return res.status(500).json(GenRes(500, null, error, error?.message, req.url));
  }
};

//Method to get user bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const bookings = await Booking.find({ userId });
    return res
      .status(200)
      .json(
        GenRes(200, bookings, null, "Bookings fetched successfully", req.url)
      );
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

const getBookingByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sortBy = 'newest' } = req.query;

    // Validate sortBy
    const validSorts = ['oldest', 'newest', 'highest', 'lowest'];
    if (!validSorts.includes(sortBy)) {
      return res
        .status(400)
        .json(GenRes(400, null, null, "Invalid sortBy value. Use: oldest, newest, highest, lowest", req.url));
    }

    // Map sortBy to MongoDB sort criteria
    const sortCriteria = {
      oldest: { createdAt: 1 },
      newest: { createdAt: -1 },
      highest: { totalAmount: -1 },
      lowest: { totalAmount: 1 }
    }[sortBy];

    // Get booking counts for each status
    const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    const bookingCountPromises = statuses.map(status =>
      Booking.countDocuments({ eventId, status })
    );

    // Get 10 most recent or sorted bookings for the event
    const recentBookings = await Booking.find({ eventId })
      .sort(sortCriteria)
      .limit(10)
      .populate('userId', 'name email')
      .select('bookingId userId businessInfo status createdAt totalAmount isHold paymentStatus eventName stallInfo');

    // Get all counts
    const [pendingCount, confirmedCount, cancelledCount, completedCount] = await Promise.all(bookingCountPromises);
    const totalBookings = pendingCount + confirmedCount + cancelledCount + completedCount;

    if (totalBookings === 0) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "No bookings found for this event", req.url));
    }

    // Create metrics object
    const metrics = {
      totalBookings,
      pending: pendingCount,
      confirmed: confirmedCount,
      cancelled: cancelledCount,
      completed: completedCount
    };

    // Create pagination object
    const pagination = {
      pendingBookings: {
        total: pendingCount,
        showing: Math.min(10, pendingCount),
        hasMore: pendingCount > 10,
        endpoint: `/admin/events/${eventId}/pending-bookings?sortBy=${sortBy}`
      },
      confirmedBookings: {
        total: confirmedCount,
        showing: Math.min(10, confirmedCount),
        hasMore: confirmedCount > 10,
        endpoint: `/admin/events/${eventId}/confirmed-bookings?sortBy=${sortBy}`
      },
      cancelledBookings: {
        total: cancelledCount,
        showing: Math.min(10, cancelledCount),
        hasMore: cancelledCount > 10,
        endpoint: `/admin/events/${eventId}/cancelled-bookings?sortBy=${sortBy}`
      },
      completedBookings: {
        total: completedCount,
        showing: Math.min(10, completedCount),
        hasMore: completedCount > 10,
        endpoint: `/admin/events/${eventId}/completed-bookings?sortBy=${sortBy}`
      }
    };

    // Create final response
    const responseData = {
      metrics,
      bookings: recentBookings,
      pagination
    };

    return res
      .status(200)
      .json(
        GenRes(200, responseData, null, "Bookings fetched successfully", req.url)
      );
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

const getBookingDashboard = async (req, res) => {
  try {
    const { sortBy = 'newest' } = req.query;

    // Validate sortBy
    const validSorts = ['oldest', 'newest', 'highest', 'lowest'];
    if (!validSorts.includes(sortBy)) {
      return res
        .status(400)
        .json(GenRes(400, null, null, "Invalid sortBy value. Use: oldest, newest, highest, lowest", req.url));
    }

    // Map sortBy to MongoDB sort criteria
    const sortCriteria = {
      oldest: { createdAt: 1 },
      newest: { createdAt: -1 },
      highest: { totalAmount: -1 },
      lowest: { totalAmount: 1 }
    }[sortBy];

    // Get booking counts for each status
    const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    const bookingCountPromises = statuses.map(status =>
      Booking.countDocuments({ status })
    );

    // Get 10 most recent or sorted bookings
    const recentBookings = await Booking.find()
      .sort(sortCriteria)
      .limit(10)
      .populate('userId', 'name email')
      .select('bookingId userId businessInfo status createdAt totalAmount');

    // Get all counts
    const [pendingCount, confirmedCount, cancelledCount, completedCount] = await Promise.all(bookingCountPromises);
    const totalBookings = pendingCount + confirmedCount + cancelledCount + completedCount;

    // Create metrics object
    const metrics = {
      totalBookings,
      pending: pendingCount,
      confirmed: confirmedCount,
      cancelled: cancelledCount,
      completed: completedCount
    };

    // Create pagination object
    const pagination = {
      pendingBookings: {
        total: pendingCount,
        showing: Math.min(10, pendingCount),
        hasMore: pendingCount > 10,
        endpoint: `/admin/pending-bookings?sortBy=${sortBy}`
      },
      confirmedBookings: {
        total: confirmedCount,
        showing: Math.min(10, confirmedCount),
        hasMore: confirmedCount > 10,
        endpoint: `/admin/confirmed-bookings?sortBy=${sortBy}`
      },
      cancelledBookings: {
        total: cancelledCount,
        showing: Math.min(10, cancelledCount),
        hasMore: cancelledCount > 10,
        endpoint: `/admin/cancelled-bookings?sortBy=${sortBy}`
      },
      completedBookings: {
        total: completedCount,
        showing: Math.min(10, completedCount),
        hasMore: completedCount > 10,
        endpoint: `/admin/completed-bookings?sortBy=${sortBy}`
      }
    };

    // Create final response
    const responseData = {
      metrics,
      bookings: recentBookings,
      pagination
    };

    return res.status(200).json(
      GenRes(200, responseData, null, 'Dashboard data fetched successfully', req.url)
    );
  } catch (error) {
    return res.status(500).json(
      GenRes(500, null, error, error.message, req.url)
    );
  }
};


const getBookingByBookingId = async (req, res) => {
  try {
    const requestedUser = req.user;
    const { bookingId } = req.params;

    if (!requestedUser) {
      return res.status(401).json(GenRes(401, null, null, "Unauthorized", req.url));
    }

    let booking;

    if (requestedUser.role === 'admin') {
      console.log("Admin access, fetching booking by ID without userId filter");
      booking = await Booking.findOne({ bookingId });
    } else {
      console.log("User access, fetching booking by ID with userId filter");
      booking = await Booking.findOne({ bookingId, userId: requestedUser.userId });
    }

    if (!booking) {
      return res.status(404).json(GenRes(404, null, null, "Booking not found", req.url));
    }

    return res.status(200).json(GenRes(200, booking, null, "Booking retrieved successfully", req.url));
  } catch (error) {
    return res.status(500).json(GenRes(500, null, error, "Error retrieving booking", req.url));
  }
};

const getAllBookings = async (req, res) => {
  try {
    // Extract pagination and filter parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || null;
    const paymentStatus = req.query.paymentStatus || null;
    const search = req.query.search || null;
    const sortBy = req.query.sortBy || "newest"; // Default to newest

    // Validate sortBy parameter
    const validSorts = ["oldest", "newest", "highest", "lowest"];
    if (!validSorts.includes(sortBy)) {
      return res.status(400).json(
        GenRes(400, null, null, "Invalid sortBy value", req.url)
      );
    }

    // Build query object for filtering
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = paymentStatus;
    }
    if (search) {
      query["businessInfo.name"] = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Define sort criteria
    const sortCriteria = {
      oldest: { createdAt: 1 },
      newest: { createdAt: -1 },
      highest: { totalAmount: -1 },
      lowest: { totalAmount: 1 },
    }[sortBy];

    // Fetch metrics using a single aggregation query
    const metrics = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]).then((results) => {
      const metricsObj = { totalBookings: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
      results.forEach(({ status, count }) => {
        if (status in metricsObj) metricsObj[status] = count;
        metricsObj.totalBookings += count;
      });
      return metricsObj;
    });

    // Get total count of filtered bookings
    const totalPages = Math.ceil(metrics.totalBookings / limit);

    // Fetch paginated, filtered, and sorted bookings
    const bookings = await Booking.find(query)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email") // Optional: Populate user data if needed
      .select("bookingId userId businessInfo status createdAt totalAmount isHold paymentStatus eventName stallInfo");

    // Log if no bookings are found
    if (bookings.length === 0) {
      console.warn(`[${new Date().toISOString()}] No bookings found for query`);
    }

    // Create pagination object
    const pagination = {
      currentPage: page,
      totalPages,
      totalBookings: metrics.totalBookings,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      limit,
      skip,
    };

    // Create filters object for frontend
    const filters = {
      status: status || null,
      paymentStatus: paymentStatus || null,
      search: search || null,
      sortBy,
      sortOrder: sortBy === "oldest" || sortBy === "lowest" ? "asc" : "desc",
    };

    return res.status(200).json(
      GenRes(
        200,
        { metrics, bookings, pagination, filters },
        null,
        "All bookings fetched successfully",
        req.url
      )
    );
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error in getAllBookings: ${err.message}`);
    return res.status(500).json(
      GenRes(500, null, err, err.message, req.url)
    );
  }
};

//Method to update booking status eg: cancel booking
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const user = req.user;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res
        .status(404)
        .json(GenRes(404, null, null, "Booking not found", req.url));
    }

    // Check if user is authorized to cancel this booking (non-admins can only cancel their own)
    if (!user.isAdmin && booking.userId !== user.userId) {
      return res
        .status(403)
        .json(
          GenRes(
            403,
            null,
            null,
            "Unauthorized to cancel this booking",
            req.url
          )
        );
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json(GenRes(400, null, null, "Invalid status", req.url));
    }

    booking.status = status;

    if (status === "cancelled" || status === "completed") {
      const stall = await Stall.findOne({ stallId: booking.stallId });
      if (stall) {
        stall.status = "available";
        await stall.save();
      }
    }

    await booking.save();
    return res
      .status(200)
      .json(
        GenRes(
          200,
          booking,
          null,
          "Booking status updated successfully",
          req.url
        )
      );
  } catch (err) {
    return res.status(500).json(GenRes(500, null, err, err?.message, req.url));
  }
};

//

module.exports = {
  createBooking,
  holdStall,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  getBookingByBookingId,
  getBookingByEventId,
  getBookingDashboard
};
