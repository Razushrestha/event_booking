const transporter = require("../../config/mailer");
const { formatCurrency } = require("../../utils/formatCurrency");
const sendEmail = async (options) => {
  try {
    const {
      to,
      subject,
      html,
      text,
      attachments = [],
      from = process.env.EMAIL
    } = options;

    // Validate required fields
    if (!to) {
      throw new Error("Recipient email address is required");
    }

    if (!subject) {
      throw new Error("Email subject is required");
    }

    if (!html && !text) {
      throw new Error("Either HTML or text content is required");
    }

    // Normalize 'to' field to always be a string of comma-separated emails
    let recipientEmails;
    if (Array.isArray(to)) {
      recipientEmails = to.join(", ");
    } else if (typeof to === "string") {
      try {
        // Check if 'to' is a stringified array
        const parsed = JSON.parse(to);
        if (Array.isArray(parsed)) {
          recipientEmails = parsed.join(", ");
        } else {
          recipientEmails = to;
        }
      } catch {
        // If JSON.parse fails, treat 'to' as a single email or comma-separated string
        recipientEmails = to;
      }
    } else {
      throw new Error("Invalid 'to' format: must be a string, array of strings, or stringified array");
    }

    // Prepare email options
    const mailOptions = {
      from: from,
      to: recipientEmails,
      subject: subject
    };

    // Add content
    if (html) {
      mailOptions.html = html;
    }

    if (text) {
      mailOptions.text = text;
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    // Send email
    const result = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully to ${recipientEmails}:`, result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      to: recipientEmails,
      subject: subject
    };

  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const sendBookingConfirmationEmail = async (bookingData, qrCodePath) => {
  try {
    const { businessInfo, contactPerson, bookingId, eventId, eventName, stallInfo, totalAmount, status, paymentStatus } = bookingData;

    const imageBaseUrl = process.env.IMAGE_URL || '';
    const frontendUrl = process.env.FRONTEND_URL || '';
    const qrCodeUrl = `${imageBaseUrl}${qrCodePath}`;

    // Generate stall details for the email
    const stallDetailsHtml = stallInfo
      .map(stall => `<li><strong>Stall:</strong> ${stall.stallName}</li>`)
      .join('');
    const stallDetailsText = stallInfo
      .map(stall => `- Stall: ${stall.stallName}`)
      .join('\n');

    // Conditionally include website link
    const websiteLinkHtml = frontendUrl ? `<a href="${frontendUrl}">${frontendUrl}</a>` : '';
    const websiteLinkText = frontendUrl ? `Website: ${frontendUrl}` : '';

    const emailOptions = {
      to: businessInfo.email,
      subject: `Thank You for Booking with ${eventName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Thank You for Being a Part of ${eventName}!</h2>
          
          <p>Dear ${businessInfo.name},</p>
          
          <p>We’re delighted to confirm your stall booking for ${eventName}! Thank you for choosing to showcase your business with us. Your participation is greatly appreciated and will contribute to making this event a success.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Booking Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Booking ID:</strong> ${bookingId}</li>
              <li><strong>Event Name:</strong> ${eventName}</li>
              ${stallDetailsHtml}
              <li><strong>Total Amount:</strong> Rs ${totalAmount}</li>
              <li><strong>Status:</strong> ${status}</li>
              <li><strong>Payment Status:</strong> ${paymentStatus}</li>
            </ul>
          </div>
          
          <p>Please find your booking QR code attached below. Kindly present this QR code at the venue for a smooth check-in process.</p>
          
          <div style="text-align:center; margin: 20px 0;">
            <img src="${qrCodeUrl}" alt="Booking QR Code" style="max-width: 200px;"/>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2d5a2d;"><strong>Important:</strong> Please save this QR code and bring it with you to the event. It will serve as your booking confirmation.</p>
          </div>
          
          <p>We’re excited to have you on board and hope this event is a rewarding experience for your business! If you have any questions or feedback, please don’t hesitate to reach out.</p>
          
          <p>Thank you once again for your participation. We look forward to seeing you at ${eventName}!</p>
          
          <p>Warm regards,</p>
          <p><strong>Event Solution Pvt. Ltd.</strong><br>
          Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103<br>
          ${websiteLinkHtml}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
        </div>
      `,
      text: `
        Thank You for Booking with ${eventName}!
        
        Dear ${businessInfo.name},
        
        We’re delighted to confirm your stall booking for ${eventName}! Thank you for choosing to showcase your business with us. Your participation is greatly appreciated and will contribute to making this event a success.
        
        Your Booking Details:
        - Booking ID: ${bookingId}
        - Event Name: ${eventName}
        ${stallDetailsText}
        - Total Amount: Rs ${totalAmount}
        - Status: ${status}
        - Payment Status: ${paymentStatus}
        
        Please find your booking QR code attached. Kindly present this QR code at the venue for a smooth check-in process.
        
        Important: Please save this QR code and bring it with you to the event. It will serve as your booking confirmation.
        
        We’re excited to have you on board and hope this event is a rewarding experience for your business! If you have any questions or feedback, please don’t hesitate to reach out.
        
        Thank you once again for your participation. We look forward to seeing you at ${eventName}!
        
        Warm regards,
        Event Solution Pvt. Ltd.
        Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103
        ${websiteLinkText}
        
        ---
        This is an automated email. Please do not reply to this message.
      `,
      attachments: [
        {
          filename: `booking-${bookingId}.png`,
          path: `${process.cwd()}${qrCodePath}`,
          contentType: 'image/png'
        }
      ]
    };

    return await sendEmail(emailOptions);
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    throw error;
  }
};

const sendHoldingEmail = async (bookingData, email, contactPersonEmail, minimumPaymentPercent) => {
  try {
    const { businessInfo, bookingId, eventId, eventName, stallInfo, totalAmount, holdExpiry } = bookingData;
    const minimumPayment = (totalAmount * (minimumPaymentPercent / 100)).toFixed(2); // Dynamic percentage of total amount

    // Basic email validation
    const isValidEmail = (email) => {
      return email && typeof email === 'string' && email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    // Collect valid email addresses
    const recipients = [];
    if (isValidEmail(email)) {
      recipients.push(email.trim());
    }
    if (isValidEmail(contactPersonEmail) && contactPersonEmail.trim() !== email.trim()) {
      recipients.push(contactPersonEmail.trim());
    }

    // Check if there are valid recipients
    if (recipients.length === 0) {
      const error = new Error('No valid email addresses provided');
      console.error(`Failed to send hold confirmation email for booking ${bookingId}:`, error.message);
      throw error;
    }

    // Log recipients for debugging
    console.log(`Preparing to send hold confirmation email to: ${recipients.join(', ')}`);

    // Generate stall details for the email
    const stallDetailsHtml = stallInfo
      .map(stall => `<li><strong>Stall:</strong> ${stall.stallName}</li>`)
      .join('');
    const stallDetailsText = stallInfo
      .map(stall => `- Stall: ${stall.stallName}`)
      .join('\n');

    // Conditionally include website link
    const frontendUrl = process.env.FRONTEND_URL || '';
    const websiteLinkHtml = frontendUrl ? `<a href="${frontendUrl}">${frontendUrl}</a>` : '';
    const websiteLinkText = frontendUrl ? `Website: ${frontendUrl}` : '';

    const emailOptions = {
      to: recipients, // Array of recipients
      subject: `Thank You for Your Interest in ${eventName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Thank You for Your Interest in ${eventName}!</h2>
          
          <p>Dear ${businessInfo.name},</p>
          
          <p>We’re thrilled to inform you that your stall booking for ${eventName} has been placed on a temporary hold. Thank you for choosing to participate in our event! We truly appreciate your interest and look forward to having you with us.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Booking Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Booking ID:</strong> ${bookingId}</li>
              <li><strong>Event Name:</strong> ${eventName}</li>
              ${stallDetailsHtml}
              <li><strong>Total Amount:</strong> Rs ${totalAmount.toFixed(2)}</li>
              <li><strong>Minimum Payment Required (${minimumPaymentPercent}%):</strong> Rs ${minimumPayment}</li>
              <li><strong>Hold Expiry:</strong> ${holdExpiry.toLocaleDateString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Important:</strong> This is a temporary hold and will be released if at least ${minimumPaymentPercent}% of the total payment (Rs ${minimumPayment}) is not received by ${holdExpiry.toLocaleDateString()}. Please complete the payment to confirm your booking.</p>
          </div>
          
          <p>We’re excited about the opportunity to showcase your business at ${eventName}! If you have any questions or need assistance with the payment process, please don’t hesitate to reach out.</p>
          
          <p>Thank you once again for your interest. We look forward to welcoming you!</p>
          
          <p>Warm regards,</p>
          <p><strong>Event Solution Pvt. Ltd.</strong><br>
          Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103<br>
          ${websiteLinkHtml}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
        </div>
      `,
      text: `
        Thank You for Your Interest in ${eventName}!
        
        Dear ${businessInfo.name},
        
        We’re thrilled to inform you that your stall booking for ${eventName} has been placed on a temporary hold. Thank you for choosing to participate in our event! We truly appreciate your interest and look forward to having you with us.
        
        Your Booking Details:
        - Booking ID: ${bookingId}
        - Event Name: ${eventName}
        ${stallDetailsText}
        - Total Amount: Rs ${totalAmount.toFixed(2)}
        - Minimum Payment Required (50%): Rs ${minimumPayment}
        - Hold Expiry: ${holdExpiry.toLocaleDateString()}
        
        Important: This is a temporary hold and will be released if at least 50% of the total payment (Rs ${minimumPayment}) is not received by ${holdExpiry.toLocaleDateString()}. Please complete the payment to confirm your booking.
        
        We’re excited about the opportunity to showcase your business at ${eventName}! If you have any questions or need assistance with the payment process, please don’t hesitate to reach out.
        
        Thank you once again for your interest. We look forward to welcoming you!
        
        Warm regards,
        Event Solution Pvt. Ltd.
        Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103
        ${websiteLinkText}
        
        ---
        This is an automated email.
      `
    };

    await sendEmail(emailOptions);
    console.log(`Hold confirmation email sent to: ${recipients.join(', ')}`);
  } catch (error) {
    console.error(`Error sending hold confirmation email for booking:`, error);
    throw error; // Let caller handle the error
  }
};

const sendBookingMadeEmail = async (bookingData, email, contactPersonEmail) => {
  try {
    const { businessInfo, bookingId, eventId, eventName, stallInfo, totalAmount, pendingAmount, payments } = bookingData;

    // Calculate total payment done (sum of pending and completed payments)
    const totalPaymentDone = payments
      .filter(p => ["pending", "completed"].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);

    // Basic email validation
    const isValidEmail = (email) => {
      return email && typeof email === 'string' && email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    // Collect valid email addresses
    const recipients = [];
    if (isValidEmail(email)) {
      recipients.push(email.trim());
    }
    if (isValidEmail(contactPersonEmail) && contactPersonEmail.trim() !== email.trim()) {
      recipients.push(contactPersonEmail.trim());
    }

    // Check if there are valid recipients
    if (recipients.length === 0) {
      const error = new Error('No valid email addresses provided');
      console.error(`Failed to send booking confirmation email for booking ${bookingId}:`, error.message);
      throw error;
    }

    // Generate stall details for the email
    const stallDetailsHtml = stallInfo
      .map(stall => `<li><strong>Stall:</strong> ${stall.stallName}</li>`)
      .join('');
    const stallDetailsText = stallInfo
      .map(stall => `- Stall: ${stall.stallName}`)
      .join('\n');

    // Conditionally include website link
    const frontendUrl = process.env.FRONTEND_URL || '';
    const websiteLinkHtml = frontendUrl ? `<a href="${frontendUrl}">${frontendUrl}</a>` : '';
    const websiteLinkText = frontendUrl ? `Website: ${frontendUrl}` : '';

    const emailOptions = {
      to: recipients,
      subject: `Thank You for Booking with ${eventName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Thank You for Your Booking with ${eventName}!</h2>
          
          <p>Dear ${businessInfo.name},</p>
          
          <p>We’re thrilled to confirm that your stall booking for ${eventName} has been successfully created! Thank you for choosing to showcase your business with us. Your participation will make this event even more special, and we’re grateful for your support.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your Booking Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Booking ID:</strong> ${bookingId}</li>
              <li><strong>Event Name:</strong> ${eventName}</li>
              ${stallDetailsHtml}
              <li><strong>Total Amount:</strong> Rs ${totalAmount.toFixed(2)}</li>
              <li><strong>Payment Done:</strong> Rs ${totalPaymentDone.toFixed(2)}</li>
              <li><strong>Payment Remaining:</strong> Rs ${pendingAmount.toFixed(2)}</li>
            </ul>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Important:</strong> Your payment is currently under review by our admin team. You will receive a final confirmation email once the payment is verified. Please ensure all payments are completed to secure your booking.</p>
          </div>
          
          <p>We’re excited to have you on board and hope this event is a rewarding experience for your business! If you have any questions or need assistance, please don’t hesitate to reach out.</p>
          
          <p>Thank you once again for your participation. We look forward to seeing you at ${eventName}!</p>
          
          <p>Warm regards,</p>
          <p><strong>Event Solution Pvt. Ltd.</strong><br>
          Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103<br>
          ${websiteLinkHtml}</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
        </div>
      `,
      text: `
        Thank You for Booking with ${eventName}!
        
        Dear ${businessInfo.name},
        
        We’re thrilled to confirm that your stall booking for ${eventName} has been successfully created! Thank you for choosing to showcase your business with us. Your participation will make this event even more special, and we’re grateful for your support.
        
        Your Booking Details:
        - Booking ID: ${bookingId}
        - Event Name: ${eventName}
        ${stallDetailsText}
        - Total Amount: Rs ${totalAmount.toFixed(2)}
        - Payment Done: Rs ${totalPaymentDone.toFixed(2)}
        - Payment Remaining: Rs ${pendingAmount.toFixed(2)}
        
        Important: Your payment is currently under review by our admin team. You will receive a final confirmation email once the payment is verified. Please ensure all payments are completed to secure your booking.
        
        We’re excited to have you on board and hope this event is a rewarding experience for your business! If you have any questions or need assistance, please don’t hesitate to reach out.
        
        Thank you once again for your participation. We look forward to seeing you at ${eventName}!
        
        Warm regards,
        Event Solution Pvt. Ltd.
        Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103
        ${websiteLinkText}
        
        ---
        This is an automated email. Please do not reply to this message.
      `
    };

    await sendEmail(emailOptions);
    console.log(`Booking confirmation email sent to ${recipients.join(', ')}`);
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    throw error; // Let caller handle the error
  }
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise} Email send result
 */
const sendOTPEmail = async (email, otp) => {
  try {
    const emailOptions = {
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Your OTP Code</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: #2c3e50; margin-top: 0;">Your OTP Code:</h3>
            <div style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 3px; margin: 20px 0;">
              ${otp}
            </div>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Important:</strong> This OTP will expire in 5 minutes. Do not share this code with anyone.</p>
          </div>
          
          <p>If you didn't request this OTP, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
        </div>
      `
    };

    return await sendEmail(emailOptions);

  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};

const sendBookingHoldReminderEmail = async (booking, emails, minimumPaymentPercent) => {
  try {
    // Basic email validation
    const isValidEmail = (email) => {
      return email && typeof email === 'string' && email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    // Filter valid emails
    const recipients = emails.filter(isValidEmail).map(email => email.trim());

    // Check if there are valid recipients
    if (recipients.length === 0) {
      const error = new Error('No valid email addresses provided');
      console.error(`Failed to send hold reminder email for booking ${booking.bookingId}:`, error.message);
      throw error;
    }

    // Conditionally include website link
    const frontendUrl = process.env.FRONTEND_URL || '';
    const websiteLinkHtml = frontendUrl ? `<a href="${frontendUrl}">${frontendUrl}</a>` : '';
    const websiteLinkText = frontendUrl ? `Website: ${frontendUrl}` : '';

    const subject = `Reminder: Your Booking for ${booking.eventName} is Expiring Soon`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Reminder: Your Booking is Expiring Soon</h2>
        
        <p>Dear ${booking.businessInfo.name},</p>
        
        <p>We hope this message finds you well! This is a friendly reminder that your stall booking for <strong>${booking.eventName}</strong> (Booking ID: ${booking.bookingId}) is currently on hold and will expire on <strong>${booking.holdExpiry.toLocaleDateString()}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Booking Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
            <li><strong>Event Name:</strong> ${booking.eventName}</li>
            ${booking.stallInfo.map(s => `<li><strong>Stall:</strong> ${s.stallName}</li>`).join('')}
            <li><strong>Total Amount:</strong> Rs ${booking.totalAmount.toFixed(2)}</li>
            <li><strong>Minimum Payment Required (${minimumPaymentPercent}%):</strong> Rs ${(booking.totalAmount * (minimumPaymentPercent / 100)).toFixed(2)}</li>
            <li><strong>Hold Expiry:</strong> ${booking.holdExpiry.toLocaleDateString()}</li>
          </ul>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Important:</strong> To secure your stall, please complete the minimum payment of Rs ${(booking.totalAmount * 0.5).toFixed(2)} before the hold expires on ${booking.holdExpiry.toLocaleDateString()}. Failure to do so may result in the release of your stall.</p>
        </div>
        
        <p>We’re excited to have you join us at ${booking.eventName}! If you need assistance with the payment process or have any questions, please don’t hesitate to reach out.</p>
        
        <p>Thank you for choosing Event Solution Pvt. Ltd. We look forward to seeing you at the event!</p>
        
        <p>Warm regards,</p>
        <p><strong>Event Solution Pvt. Ltd.</strong><br>
        Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103<br>
        ${websiteLinkHtml}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `;
    const text = `
      Reminder: Your Booking for ${booking.eventName} is Expiring Soon
      
      Dear ${booking.businessInfo.name},
      
      We hope this message finds you well! This is a friendly reminder that your stall booking for ${booking.eventName} (Booking ID: ${booking.bookingId}) is currently on hold and will expire on ${booking.holdExpiry.toLocaleDateString()}.
      
      Booking Details:
      - Booking ID: ${booking.bookingId}
      - Event Name: ${booking.eventName}
      ${booking.stallInfo.map(s => `- Stall: ${s.stallName}`).join('\n')}
      - Total Amount: Rs ${booking.totalAmount.toFixed(2)}
      - Minimum Payment Required (${minimumPaymentPercent}%): Rs ${(booking.totalAmount * (minimumPaymentPercent / 100)).toFixed(2)}
      - Hold Expiry: ${booking.holdExpiry.toLocaleDateString()}

      Important: To secure your stall, please complete the minimum payment of Rs ${(booking.totalAmount * (minimumPaymentPercent / 100)).toFixed(2)} before the hold expires on ${booking.holdExpiry.toLocaleDateString()}. Failure to do so may result in the release of your stall.

      We’re excited to have you join us at ${booking.eventName}! If you need assistance with the payment process or have any questions, please don’t hesitate to reach out.
      
      Thank you for choosing Event Solution Pvt. Ltd. We look forward to seeing you at the event!
      
      Warm regards,
      Event Solution Pvt. Ltd.
      Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103
      ${websiteLinkText}
      
      ---
      This is an automated email. Please do not reply to this message.
    `;

    const result = await sendEmail({
      to: recipients.join(", "),
      subject,
      html,
      text
    });

    console.log(`Hold reminder email sent to: ${recipients.join(', ')}`);
    return result;
  } catch (error) {
    console.error(`Failed to send hold reminder email for booking ${booking.bookingId}:`, error);
    throw error;
  }
};

const sendBookingCancellationEmail = async (booking, emails) => {
  try {
    // Basic email validation
    const isValidEmail = (email) => {
      return email && typeof email === 'string' && email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    // Filter valid emails
    const recipients = emails.filter(isValidEmail).map(email => email.trim());

    // Check if there are valid recipients
    if (recipients.length === 0) {
      const error = new Error('No valid email addresses provided');
      console.error(`Failed to send cancellation email for booking ${booking.bookingId}:`, error.message);
      throw error;
    }

    // Conditionally include website link
    const frontendUrl = process.env.FRONTEND_URL || '';
    const websiteLinkHtml = frontendUrl ? `<a href="${frontendUrl}">${frontendUrl}</a>` : '';
    const websiteLinkText = frontendUrl ? `Website: ${frontendUrl}` : '';

    const subject = `Cancellation Notice for Your Booking with ${booking.eventName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Booking Cancellation Notice</h2>
        
        <p>Dear ${booking.businessInfo.name},</p>
        
        <p>We regret to inform you that your stall booking for <strong>${booking.eventName}</strong> (Booking ID: ${booking.bookingId}) has been cancelled due to the expiration of the hold period on <strong>${booking.holdExpiry.toLocaleDateString()}</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Booking Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
            <li><strong>Event Name:</strong> ${booking.eventName}</li>
            ${booking.stallInfo.map(s => `<li><strong>Stall:</strong> ${s.stallName}</li>`).join('')}
            <li><strong>Total Amount:</strong> Rs ${booking.totalAmount.toFixed(2)}</li>
          </ul>
        </div>
        
        <p>We’re sorry that we couldn’t proceed with your booking this time. If you’d like to rebook a stall for <strong>${booking.eventName}</strong> or explore other opportunities with us, please don’t hesitate to get in touch. We’d love to have you join us!</p>
        
        <p>Thank you for your interest in Event Solution Pvt. Ltd. If you have any questions or need further assistance, please feel free to reach out.</p>
        
        <p>Warm regards,</p>
        <p><strong>Event Solution Pvt. Ltd.</strong><br>
        Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103<br>
        ${websiteLinkHtml}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `;
    const text = `
      Cancellation Notice for Your Booking with ${booking.eventName}
      
      Dear ${booking.businessInfo.name},
      
      We regret to inform you that your stall booking for ${booking.eventName} (Booking ID: ${booking.bookingId}) has been cancelled due to the expiration of the hold period on ${booking.holdExpiry.toLocaleDateString()}.
      
      Booking Details:
      - Booking ID: ${booking.bookingId}
      - Event Name: ${booking.eventName}
      ${booking.stallInfo.map(s => `- Stall: ${s.stallName}`).join('\n')}
      - Total Amount: Rs ${booking.totalAmount.toFixed(2)}
      
      We’re sorry that we couldn’t proceed with your booking this time. If you’d like to rebook a stall for ${booking.eventName} or explore other opportunities with us, please don’t hesitate to get in touch. We’d love to have you join us!
      
      Thank you for your interest in Event Solution Pvt. Ltd. If you have any questions or need further assistance, please feel free to reach out.
      
      Warm regards,
      Event Solution Pvt. Ltd.
      Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103
      ${websiteLinkText}
      
      ---
      This is an automated email. Please do not reply to this message.
    `;

    const result = await sendEmail({
      to: recipients.join(", "),
      subject,
      html,
      text
    });

    console.log(`Cancellation email sent to: ${recipients.join(', ')}`);
    return result;
  } catch (error) {
    console.error(`Failed to send cancellation email for booking ${booking.bookingId}:`, error);
    throw error;
  }
};

const sendPaymentFailedEmail = async (booking, paymentId, emails, failedNote) => {
  try {
    // Find the payment details
    const payment = booking.payments.find(p => p.paymentId === paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    // Basic email validation
    const isValidEmail = (email) => {
      return email && typeof email === 'string' && email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    // Filter valid emails
    const recipients = emails.filter(isValidEmail).map(email => email.trim());

    // Check if there are valid recipients
    if (recipients.length === 0) {
      const error = new Error('No valid email addresses provided');
      console.error(`Failed to send payment failed email for booking ${booking.bookingId}:`, error.message);
      throw error;
    }

    // Conditionally include website link
    const frontendUrl = process.env.FRONTEND_URL || '';
    const websiteLinkHtml = frontendUrl ? `<a href="${frontendUrl}">${frontendUrl}</a>` : '';
    const websiteLinkText = frontendUrl ? `Website: ${frontendUrl}` : '';

    const subject = `Payment Issue for Your ${booking.eventName} Booking`;

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Payment Issue Notice</h2>
        
        <p>Dear ${booking.businessInfo.name},</p>
        
        <p>We’re sorry to inform you that a payment for your booking with <strong>${booking.eventName}</strong> (Booking ID: ${booking.bookingId}) was not successful.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Payment Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Payment ID:</strong> ${payment.paymentId}</li>
            <li><strong>Amount:</strong> Rs ${payment.amount.toFixed(2)}</li>
            <li><strong>Reason for Failure:</strong> ${failedNote}</li>
          </ul>
        </div>
    `;

    let textContent = `
      Payment Issue Notice
      
      Dear ${booking.businessInfo.name},
      
      We’re sorry to inform you that a payment for your booking with ${booking.eventName} (Booking ID: ${booking.bookingId}) was not successful.
      
      Payment Details:
      - Payment ID: ${payment.paymentId}
      - Amount: Rs ${payment.amount.toFixed(2)}
      - Reason for Failure: ${failedNote}
    `;

    if (booking.isHold && booking.holdExpiry) {
      const holdExpiryDate = new Date(booking.holdExpiry);
      const now = new Date();
      const timeRemainingMs = holdExpiryDate.getTime() - now.getTime();
      const timeRemainingHours = Math.ceil(timeRemainingMs / (1000 * 60 * 60));

      htmlContent += `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Important:</strong> Your booking is currently on hold until <strong>${holdExpiryDate.toLocaleDateString()}</strong> (${timeRemainingHours} hours remaining). To secure your stall, please submit at least 50% of the payment (Rs ${(booking.totalAmount * 0.5).toFixed(2)}) before the hold expires to avoid cancellation.</p>
        </div>
      `;
      textContent += `
        Important: Your booking is currently on hold until ${holdExpiryDate.toLocaleDateString()} (${timeRemainingHours} hours remaining). To secure your stall, please submit at least 50% of the payment (Rs ${(booking.totalAmount * 0.5).toFixed(2)}) before the hold expires to avoid cancellation.
      `;
    } else if (!booking.isHold && booking.status === "confirmed") {
      htmlContent += `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>Important:</strong> Your booking is confirmed, but the payment (ID: ${payment.paymentId}, Amount: Rs ${payment.amount.toFixed(2)}) was not accepted due to: <strong>${failedNote}</strong>. Please submit a new payment to maintain your booking status.</p>
        </div>
      `;
      textContent += `
        Important: Your booking is confirmed, but the payment (ID: ${payment.paymentId}, Amount: Rs ${payment.amount.toFixed(2)}) was not accepted due to: ${failedNote}. Please submit a new payment to maintain your booking status.
      `;
    }

    htmlContent += `
        <p>If you believe this is an error or need assistance with the payment process, please don’t hesitate to contact us. We’re here to help ensure your participation in <strong>${booking.eventName}</strong>.</p>
        
        <p>Thank you for choosing Event Solution Pvt. Ltd. We look forward to assisting you further!</p>
        
        <p>Warm regards,</p>
        <p><strong>Event Solution Pvt. Ltd.</strong><br>
        Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103<br>
        ${websiteLinkHtml}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `;
    textContent += `
      If you believe this is an error or need assistance with the payment process, please don’t hesitate to contact us. We’re here to help ensure your participation in ${booking.eventName}.
      
      Thank you for choosing Event Solution Pvt. Ltd. We look forward to assisting you further!
      
      Warm regards,
      Event Solution Pvt. Ltd.
      Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103
      ${websiteLinkText}
      
      ---
      This is an automated email. Please do not reply to this message.
    `;

    const result = await sendEmail({
      to: recipients.join(", "),
      subject,
      html: htmlContent,
      text: textContent
    });

    console.log(`Payment failed email sent to: ${recipients.join(', ')}`);
    return result;
  } catch (error) {
    console.error(`Failed to send payment failed email for booking ${booking.bookingId}:`, error);
    throw error;
  }
};

const sendDiscountAppliedEmail = async (booking, discountAmount, emails) => {
  try {
    // Basic email validation
    const isValidEmail = (email) => {
      return email && typeof email === 'string' && email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    // Filter valid emails
    const recipients = emails.filter(isValidEmail).map(email => email.trim());

    // Check if there are valid recipients
    if (recipients.length === 0) {
      const error = new Error('No valid email addresses provided');
      console.error(`Failed to send discount email for booking ${booking.bookingId}:`, error.message);
      throw error;
    }

    // Conditionally include website link
    const frontendUrl = process.env.FRONTEND_URL || '';
    const websiteLinkHtml = frontendUrl ? `<a href="${frontendUrl}">${frontendUrl}</a>` : '';
    const websiteLinkText = frontendUrl ? `Website: ${frontendUrl}` : '';

    const subject = `Discount Applied to Your ${booking.eventName} Booking`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Great News: Discount Applied to Your Booking!</h2>
        
        <p>Dear ${booking.businessInfo.name},</p>
        
        <p>We’re excited to share that a discount has been applied to your stall booking for <strong>${booking.eventName}</strong> (Booking ID: ${booking.bookingId}). Thank you for choosing to participate in our event! We truly appreciate your support and look forward to seeing you there.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Booking Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
            <li><strong>Event Name:</strong> ${booking.eventName}</li>
            ${booking.stallInfo.map(s => `<li><strong>Stall:</strong> ${s.stallName}</li>`).join('')}
            <li><strong>Discount Amount:</strong> Rs ${discountAmount.toFixed(2)}</li>
            <li><strong>New Total Amount:</strong> Rs ${booking.totalAmount.toFixed(2)}</li>
            <li><strong>Pending Amount:</strong> Rs ${booking.pendingAmount.toFixed(2)}</li>
          </ul>
        </div>
        
        <p>If you have any questions about this discount or believe there’s an error, please don’t hesitate to reach out. We’re here to assist you!</p>
        
        <p>Thank you once again for being a part of <strong>${booking.eventName}</strong>. We can’t wait to see your stall shine!</p>
        
        <p>Warm regards,</p>
        <p><strong>Event Solution Pvt. Ltd.</strong><br>
        Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103<br>
        ${websiteLinkHtml}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
      </div>
    `;
    const text = `
      Great News: Discount Applied to Your ${booking.eventName} Booking
      
      Dear ${booking.businessInfo.name},
      
      We’re excited to share that a discount has been applied to your stall booking for ${booking.eventName} (Booking ID: ${booking.bookingId}). Thank you for choosing to participate in our event! We truly appreciate your support and look forward to seeing you there.
      
      Booking Details:
      - Booking ID: ${booking.bookingId}
      - Event Name: ${booking.eventName}
      ${booking.stallInfo.map(s => `- Stall: ${s.stallName}`).join('\n')}
      - Discount Amount: Rs ${discountAmount.toFixed(2)}
      - New Total Amount: Rs ${booking.totalAmount.toFixed(2)}
      - Pending Amount: Rs ${booking.pendingAmount.toFixed(2)}
      
      If you have any questions about this discount or believe there’s an error, please don’t hesitate to reach out. We’re here to assist you!
      
      Thank you once again for being a part of ${booking.eventName}. We can’t wait to see your stall shine!
      
      Warm regards,
      Event Solution Pvt. Ltd.
      Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103
      ${websiteLinkText}
      
      ---
      This is an automated email. Please do not reply to this message.
    `;

    const result = await sendEmail({
      to: recipients.join(", "),
      subject,
      html,
      text
    });

    console.log(`Discount applied email sent to: ${recipients.join(', ')}`);
    return result;
  } catch (error) {
    console.error(`Failed to send discount email for booking ${booking.bookingId}:`, error);
    throw error;
  }
};


module.exports = {
  sendEmail,
  sendBookingConfirmationEmail,
  sendOTPEmail,
  sendHoldingEmail,
  sendBookingMadeEmail,
  sendBookingHoldReminderEmail,
  sendBookingCancellationEmail,
  sendPaymentFailedEmail,
  sendDiscountAppliedEmail
};