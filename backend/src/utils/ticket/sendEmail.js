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


const sendTicketConfirmationEmail = async (ticketData) => {
    try {
        const { ticketId, eventId, eventName, name, email, ticketInfo, qr } = ticketData;

        const imageBaseUrl = process.env.IMAGE_URL || '';
        const qrCodeUrl = `${imageBaseUrl}${qr}`;
        const frontendUrl = process.env.FRONTEND_URL || '';

        // Generate ticket details for the email
        const ticketDetailsHtml = `
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
            <li><strong>Event Name:</strong> ${eventName}</li>
            <li><strong>Ticket Tier:</strong> ${ticketInfo.tierName}</li>
            <li><strong>Price:</strong> ${ticketInfo.price === 0 ? 'Free' : `Rs ${ticketInfo.price}`}</li>
        `;
        const ticketDetailsText = `
            - Ticket ID: ${ticketId}
            - Event Name: ${eventName}
            - Ticket Tier: ${ticketInfo.tierName}
            - Price: ${ticketInfo.price === 0 ? 'Free' : `Rs ${ticketInfo.price}`}
        `;

        // Conditionally include website link
        const websiteLinkHtml = frontendUrl ? `<a href="${frontendUrl}">${frontendUrl}</a>` : '';
        const websiteLinkText = frontendUrl ? `Website: ${frontendUrl}` : '';

        const emailOptions = {
            to: email,
            subject: `Thank You for Joining ${eventName}!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Thank You for Being a Part of ${eventName}!</h2>
                    
                    <p>Dear ${name},</p>
                    
                    <p>We’re thrilled to confirm your participation in ${eventName}! Thank you for joining us as a valued visitor. Your presence will make this event even more special, and we’re so grateful for your support.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Your Ticket Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            ${ticketDetailsHtml}
                        </ul>
                    </div>
                    
                    <p>Please find your ticket QR code attached below. Kindly present this QR code at the event for a smooth check-in experience.</p>
                    
                    <div style="text-align:center; margin: 20px 0;">
                        <img src="${qrCodeUrl}" alt="Ticket QR Code" style="max-width: 200px;"/>
                    </div>
                    
                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #2d5a2d;"><strong>Important:</strong> Please save this QR code and bring it with you to the event. It will serve as your entry pass.</p>
                    </div>
                    
                    <p>We hope you have an amazing time at ${eventName}! If you have any questions or feedback, please don’t hesitate to reach out. We’d love to hear from you.</p>
                    
                    <p>Thank you once again for being a part of our event. We look forward to seeing you there!</p>
                    
                    <p>Warm regards,</p>
                    <p><strong>Event Solution Pvt. Ltd.</strong><br>
                    Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103<br>
                    ${websiteLinkHtml}</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
                </div>
            `,
            text: `
                Thank You for Joining ${eventName}!
                
                Dear ${name},
                
                We’re thrilled to confirm your participation in ${eventName}! Thank you for joining us as a valued visitor. Your presence will make this event even more special, and we’re so grateful for your support.
                
                Your Ticket Details:
                ${ticketDetailsText}
                
                Please find your ticket QR code attached. Kindly present this QR code at the event for a smooth check-in experience.
                
                Important: Please save this QR code and bring it with you to the event. It will serve as your entry pass.
                
                We hope you have an amazing time at ${eventName}! If you have any questions or feedback, please don’t hesitate to reach out. We’d love to hear from you.
                
                Thank you once again for being a part of our event. We look forward to seeing you there!
                
                Warm regards,
                Event Solution Pvt. Ltd.
                Email: info@eventsolutionnepal.com.np | Phone: +977-01-5260535/01-5260103
                ${websiteLinkText}
                
                ---
                This is an automated email. Please do not reply to this message.
            `,
            attachments: [
                {
                    filename: `ticket-${ticketId}.png`,
                    path: `${process.cwd()}${qr}`,
                    contentType: 'image/png'
                }
            ]
        };

        await sendEmail(emailOptions);
    } catch (error) {
        console.error('[Send Ticket Confirmation Email Error]', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    sendTicketConfirmationEmail
};