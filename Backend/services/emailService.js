import nodemailer from "nodemailer";

const isBlockedEmail = (email) => {
  if (!email || typeof email !== "string") return true;
  const trimmed = email.trim().toLowerCase();
  return trimmed.endsWith("@traveloop.com") || trimmed === "traveloop.com";
};

const sendMailWithRetry = async (transporter, mailOptions, retries = 3) => {
  if (isBlockedEmail(mailOptions.to)) {
    console.warn(`[Email Service] Outgoing email blocked: Recipient domain matches traveloop.com (${mailOptions.to})`);
    return { messageId: "blocked-traveloop", response: "250 OK (Blocked local domain)" };
  }
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (err) {
      console.error(`[Email Service] sendMail Attempt ${attempt} failed:`, err.message);
      if (attempt === retries) {
        throw err;
      }
    }
  }
};

const createTransporter = async () => {
  const user = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground";

  if (!user || !clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail API configuration missing for emailService. Check your environment variables.");
  }

  // 1. Initialize OAuth2
  console.log("[Email Service] OAuth2 initialized");

  // Create OAuth2 client and obtain access token using googleapis
  const { google } = await import("googleapis");
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const accessTokenRes = await oauth2Client.getAccessToken();
    const accessToken = accessTokenRes.token;
    console.log("[Email Service] Access token generated");

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken,
      },
    });
  } catch (error) {
    console.error("[Email Service] Failed to retrieve access token:", error.message);
    throw error;
  }
};

const BRAND_COLOR = "#14B8B5";
const EMAIL_TEMPLATE_WRAPPER = (content) => `
  <div style="font-family: 'Poppins', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: ${BRAND_COLOR}; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Traveloop</h1>
      <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Your Premium Travel Companion</p>
    </div>
    <div style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      ${content}
    </div>
    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Traveloop. All rights reserved.</p>
      <p style="margin: 4px 0 0 0;">Need help? Contact <a href="mailto:support@traveloop.com" style="color: ${BRAND_COLOR}; text-decoration: none;">support@traveloop.com</a></p>
    </div>
  </div>
`;

export const sendOtpEmail = async (to, firstName, otpCode) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Outgoing OTP email blocked for: ${to}`);
    return;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">✈️</span>
    </div>
    <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 22px; font-weight: 700;">Verify Your Email Address</h2>
    <p>Hi ${firstName || "Traveler"},</p>
    <p>Thank you for choosing <strong>Traveloop</strong>! To complete your registration and begin planning your next adventures, please use the following one-time verification code:</p>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 1px solid #f1f5f9;">
      <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">One-Time Verification Code</span>
      <h3 style="margin: 0; color: ${BRAND_COLOR}; font-size: 36px; font-weight: 800; letter-spacing: 6px;">${otpCode}</h3>
      <span style="color: #94a3b8; font-size: 12px; display: block; margin-top: 12px;">This code is valid for <strong>5 minutes</strong>.</span>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; color: #64748b;">
      <tr>
        <td style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
          <strong>Security Notice:</strong> The Traveloop team will never ask for your password or this verification code via phone, chat, or email. If you did not request this code, please ignore this email.
        </td>
      </tr>
    </table>

    <p style="margin-top: 24px;">Let's get your bags packed and journey started!</p>
    <p>Warmly,<br><strong>The Traveloop Team</strong></p>
  `);

  console.log("[Email Service] Sending OTP email to:", to, "from:", senderEmail);
  const mailOptions = {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: "Verify Your Traveloop Account ✈️",
    html,
  };
  console.log("[Email Service] final sendMail options:", {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });
  try {
    const info = await sendMailWithRetry(transporter, mailOptions);
    console.log("[Email Service] Email sent successfully");
    console.log("[Email Service] Complete sendMail Response Object:", JSON.stringify(info, null, 2));
    console.log("[Email Service] messageId:", info.messageId);
    console.log("[Email Service] accepted:", info.accepted);
    console.log("[Email Service] rejected:", info.rejected);
    console.log("[Email Service] response:", info.response);
  } catch (err) {
    console.error("[Email Service] transporter.sendMail threw error:", err.message, err);
    throw err;
  }
};

export const sendWelcomeEmail = async (to, firstName) => {
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <h2 style="color: #1e293b; margin-top: 0;">Welcome aboard, ${firstName}! 👋</h2>
    <p>We are absolutely thrilled to welcome you to Traveloop. Your journey to seamless, memorable, and beautifully coordinated travel planning starts right here.</p>
    <p>With Traveloop, you can:</p>
    <ul style="padding-left: 20px; color: #475569;">
      <li>Create and customize detailed itineraries for your trips</li>
      <li>Collaborate in real-time with friends and co-travelers</li>
      <li>Track and manage budgets seamlessly</li>
      <li>Keep all your bookings and documents in one secure place</li>
    </ul>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://traveloop.com/dashboard" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Explore Your Dashboard</a>
    </div>
    <p>If you have any questions, our support team is always here to help.</p>
    <p>Safe travels,<br><strong>The Traveloop Team</strong></p>
  `);

  await sendMailWithRetry(transporter, {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: "Welcome to Traveloop! ✈️",
    html,
  });
};

export const sendBookingConfirmation = async (to, bookingData) => {
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

  const { title, date, price, bookingId, guestName } = bookingData;
  const html = EMAIL_TEMPLATE_WRAPPER(`
    <h2 style="color: #1e293b; margin-top: 0;">Booking Confirmed! 🎉</h2>
    <p>Hi ${guestName || "Traveler"},</p>
    <p>Great news! Your booking has been successfully confirmed. Below are the details of your reservation:</p>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #f1f5f9;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 6px 0; font-size: 14px;">Booking ID:</td>
          <td style="color: #1e293b; padding: 6px 0; font-weight: 600; text-align: right;">#${bookingId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0; font-size: 14px;">Destination/Item:</td>
          <td style="color: #1e293b; padding: 6px 0; font-weight: 600; text-align: right;">${title}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0; font-size: 14px;">Date:</td>
          <td style="color: #1e293b; padding: 6px 0; font-weight: 600; text-align: right;">${date}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 6px 0; font-size: 14px;">Total Price:</td>
          <td style="color: ${BRAND_COLOR}; padding: 6px 0; font-weight: 700; text-align: right;">$${price}</td>
        </tr>
      </table>
    </div>

    <p>You can view and manage your complete booking details directly inside your Traveloop account.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://traveloop.com/bookings" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Manage Bookings</a>
    </div>
    <p>Have an incredible experience!</p>
    <p>Warmly,<br><strong>The Traveloop Team</strong></p>
  `);

  await sendMailWithRetry(transporter, {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: `Booking Confirmed: #${bookingId} - ${title}`,
    html,
  });
};

export const sendItineraryEmail = async (to, itineraryData) => {
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

  const { tripName, startDate, endDate, destinations } = itineraryData;
  
  let destinationsHtml = "";
  if (destinations && destinations.length > 0) {
    destinationsHtml = `
      <h3 style="color: #1e293b; margin-top: 20px;">Destinations Included:</h3>
      <ol style="padding-left: 20px; color: #475569;">
        ${destinations.map(dest => `<li style="margin-bottom: 8px;"><strong>${dest.name}</strong>${dest.duration ? ` - ${dest.duration}` : ""}</li>`).join("")}
      </ol>
    `;
  }

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <h2 style="color: #1e293b; margin-top: 0;">Your Travel Itinerary 🗺️</h2>
    <p>Here is the curated itinerary for your upcoming adventure: <strong>${tripName}</strong>.</p>
    
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 14px; color: #64748b;">Trip Dates:</p>
      <p style="margin: 4px 0 0 0; font-weight: 600; color: #1e293b; font-size: 16px;">${startDate} to ${endDate}</p>
    </div>

    ${destinationsHtml}

    <p>Open the Traveloop app to view day-by-day maps, collaborate with trip members, and log your budget on the go.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://traveloop.com/trips" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Open Trip Itinerary</a>
    </div>
    <p>Wishing you clear skies and safe travels!</p>
    <p>Best regards,<br><strong>The Traveloop Team</strong></p>
  `);

  await sendMailWithRetry(transporter, {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: `Your Itinerary: ${tripName}`,
    html,
  });
};

export const sendGenericInvoiceEmail = async (to, invoiceData) => {
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

  const { invoiceNumber, date, items, total, customerName } = invoiceData;
  
  let itemsHtml = "";
  if (items && items.length > 0) {
    itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #334155;">${item.description}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #334155; text-align: right;">$${item.price}</td>
      </tr>
    `).join("");
  }

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <h2 style="color: #1e293b; margin-top: 0;">Your Traveloop Invoice 📄</h2>
    <p>Hi ${customerName || "Customer"},</p>
    <p>Thank you for booking with Traveloop. Here is the invoice for your recent transaction.</p>
    
    <div style="margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
        Invoice ID: <strong>#${invoiceNumber}</strong><br>
        Date: <strong>${date}</strong>
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0;">
            <th style="text-align: left; padding-bottom: 8px; color: #475569; font-weight: 600;">Description</th>
            <th style="text-align: right; padding-bottom: 8px; color: #475569; font-weight: 600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td style="padding: 16px 0 8px 0; font-weight: 700; color: #1e293b; font-size: 16px;">Total Paid:</td>
            <td style="padding: 16px 0 8px 0; font-weight: 700; color: ${BRAND_COLOR}; font-size: 18px; text-align: right;">$${total}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>If you need any adjustments or detailed receipts for business travel, feel free to reply directly to this email.</p>
    <p>Warmly,<br><strong>The Traveloop Team</strong></p>
  `);

  await sendMailWithRetry(transporter, {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: `Invoice #${invoiceNumber} from Traveloop`,
    html,
  });
};

export const sendPromotionalEmail = async (to, promoData) => {
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

  const { title, description, code, discount, expiryDate } = promoData;
  const html = EMAIL_TEMPLATE_WRAPPER(`
    <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 24px;">✨ ${title} ✨</h2>
    <p style="text-align: center; color: #475569; font-size: 16px; margin-bottom: 24px;">${description}</p>
    
    <div style="background-color: #f0fdfa; border: 2px dashed ${BRAND_COLOR}; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="margin: 0; color: #0f766e; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Use Promo Code</p>
      <h3 style="margin: 8px 0; color: ${BRAND_COLOR}; font-size: 32px; font-weight: 800; letter-spacing: 2px;">${code}</h3>
      <p style="margin: 0; color: #0f766e; font-weight: 700; font-size: 18px;">Get ${discount} OFF your next booking</p>
      <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 12px;">Valid until: ${expiryDate}</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://traveloop.com/explore" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Claim Your Discount</a>
    </div>
    <p>Don't miss out on planning your next dream getaway for less!</p>
    <p>Best regards,<br><strong>The Traveloop Team</strong></p>
  `);

  await sendMailWithRetry(transporter, {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: `Special Offer: ${title} 🎁`,
    html,
  });
};

export const sendInvoiceEmail = async (to, invoiceData) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Outgoing Invoice email blocked for: ${to}`);
    return;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

  const {
    tripName,
    bookingId,
    passengers = [],
    seatNumbers = [],
    travelDate,
    pickupPoint,
    dropPoint,
    amountPaid,
    paymentId,
    bookingStatus,
    qrUnlockStatus,
    emergencyContact
  } = invoiceData;

  const taxAmount = (amountPaid * 0.05).toFixed(2);
  const baseFare = (amountPaid - taxAmount).toFixed(2);

  const passengerRows = passengers.map(p => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;"><strong>${p.name}</strong> (${p.gender ? p.gender[0] : "O"}, Age ${p.age || "N/A"})</td>
      <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">Seat ${p.seatNumber || "N/A"}</td>
      <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b;">${p.email || to}</td>
    </tr>
  `).join("");

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <div style="border-bottom: 2px solid ${BRAND_COLOR}; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Booking Invoice / Receipt</h2>
      <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Booking Reference: <strong>${bookingId}</strong></p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding-right: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Trip Details</h4>
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;">${tripName}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">Travel Date: <strong>${travelDate}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">Boarding: <strong>${pickupPoint}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">Drop: <strong>${dropPoint}</strong></p>
        </td>
        <td style="width: 50%; vertical-align: top; padding-left: 12px; border-left: 1px solid #f1f5f9;">
          <h4 style="margin: 0 0 6px 0; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Payment Details</h4>
          <p style="margin: 0; font-size: 13px; color: #475569;">Status: <strong style="color: #0d9488;">${bookingStatus}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">Payment ID: <strong>${paymentId || "N/A"}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">QR Code Pass: <strong>${qrUnlockStatus}</strong></p>
          <p style="margin: 4px 0; font-size: 13px; color: #475569;">Emergency SOS Contact: <strong>${emergencyContact || "N/A"}</strong></p>
        </td>
      </tr>
    </table>

    <h4 style="color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin: 24px 0 10px 0;">Passenger List</h4>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px; font-weight: 700; font-size: 12px; color: #475569;">Passenger</td>
          <td style="padding: 8px; font-weight: 700; font-size: 12px; color: #475569;">Seat Allocation</td>
          <td style="padding: 8px; font-weight: 700; font-size: 12px; color: #475569;">Email Address</td>
        </tr>
      </thead>
      <tbody>
        ${passengerRows}
      </tbody>
    </table>

    <h4 style="color: #475569; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin: 24px 0 10px 0;">Billing Summary</h4>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #475569;">Base Fare</td>
        <td style="padding: 6px 0; font-size: 13px; color: #1e293b; text-align: right;">₹${baseFare}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #475569;">Taxes & GST (5%)</td>
        <td style="padding: 6px 0; font-size: 13px; color: #1e293b; text-align: right;">₹${taxAmount}</td>
      </tr>
      <tr style="border-top: 1px solid #e2e8f0; font-weight: 700;">
        <td style="padding: 10px 0 0 0; font-size: 14px; color: #1e293b;">Total Amount Paid</td>
        <td style="padding: 10px 0 0 0; font-size: 16px; color: ${BRAND_COLOR}; text-align: right;">₹${amountPaid.toLocaleString("en-IN")}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 36px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
      <a href="https://traveloopv2.duckdns.org/api/bookings/ticket/${bookingId}" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Download Ticket PDF</a>
    </div>
  `);

  await sendMailWithRetry(transporter, {
    from: `"Traveloop Payments" <${senderEmail}>`,
    to,
    subject: `Your Traveloop Booking Invoice & Ticket - ${bookingId} 🎫`,
    html,
  });
};

/**
 * Schedule Change OTP Email — sent to each booked passenger for consent.
 * @param {string} to - Passenger email
 * @param {string} name - Passenger name
 * @param {object} data - { bookingId, newDate, newTime, otp }
 */
export const sendScheduleChangeOtpEmail = async (to, name, data) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Schedule OTP email blocked for: ${to}`);
    return;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;
  const { bookingId, newDate, newTime, otp } = data;

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">🗓️</span>
    </div>
    <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 22px; font-weight: 700;">Schedule Change Verification</h2>
    <p>Hi <strong>${name || "Traveler"}</strong>,</p>
    <p>Your travel agent has requested to modify the departure schedule for your upcoming trip. Please verify this change using the OTP below.</p>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-weight: 600;">Booking ID:</td>
          <td style="color: #1e293b; padding: 8px 0; font-weight: 700; text-align: right; font-family: monospace;">${bookingId}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-weight: 600;">New Departure Date:</td>
          <td style="color: #1e293b; padding: 8px 0; font-weight: 700; text-align: right;">${newDate}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0; font-weight: 600;">New Departure Time:</td>
          <td style="color: #1e293b; padding: 8px 0; font-weight: 700; text-align: right;">${newTime}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #f0fdfa; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 2px solid ${BRAND_COLOR};">
      <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Your Verification OTP</span>
      <h3 style="margin: 0; color: ${BRAND_COLOR}; font-size: 40px; font-weight: 800; letter-spacing: 8px;">${otp}</h3>
      <span style="color: #94a3b8; font-size: 12px; display: block; margin-top: 12px;">This code is valid for <strong>10 minutes</strong>.</span>
    </div>

    <p style="color: #64748b; font-size: 13px;">If you do not approve this change, simply ignore this email. Your agent will be unable to modify the schedule without your consent.</p>
    <p>Safe travels,<br><strong>The Traveloop Team</strong></p>
  `);

  await sendMailWithRetry(transporter, {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: `Schedule Change Verification – ${bookingId} 🗓️`,
    html,
  });
};

/**
 * Schedule Update Notification Email — sent after all passengers approved & schedule applied.
 * @param {string} to - Passenger email
 * @param {string} name - Passenger name
 * @param {object} data - { bookingId, oldDate, newDate, oldTime, newTime }
 */
export const sendScheduleUpdateNotification = async (to, name, data) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Schedule update notification blocked for: ${to}`);
    return;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;
  const { bookingId, oldDate, newDate, oldTime, newTime } = data;

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">✅</span>
    </div>
    <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 22px; font-weight: 700;">Trip Schedule Updated</h2>
    <p>Hi <strong>${name || "Traveler"}</strong>,</p>
    <p>Your trip schedule has been officially updated. Please note the new departure details below.</p>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <th style="text-align: left; color: #94a3b8; padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;" colspan="2">Previous Schedule</th>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0;">Departure Date:</td>
          <td style="color: #ef4444; padding: 8px 0; font-weight: 600; text-align: right; text-decoration: line-through;">${oldDate}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="color: #64748b; padding: 8px 0;">Departure Time:</td>
          <td style="color: #ef4444; padding: 8px 0; font-weight: 600; text-align: right; text-decoration: line-through;">${oldTime}</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <th style="text-align: left; color: #94a3b8; padding: 8px 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;" colspan="2">Updated Schedule</th>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0;">New Departure Date:</td>
          <td style="color: #10b981; padding: 8px 0; font-weight: 700; text-align: right;">${newDate}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0;">New Departure Time:</td>
          <td style="color: #10b981; padding: 8px 0; font-weight: 700; text-align: right;">${newTime}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 8px 0;">Booking ID:</td>
          <td style="color: #1e293b; padding: 8px 0; font-weight: 700; text-align: right; font-family: monospace;">${bookingId}</td>
        </tr>
      </table>
    </div>

    <p>Please update your travel plans accordingly. If you have any questions, contact your travel agent or reach out to our support team.</p>
    <p>Safe travels,<br><strong>The Traveloop Team</strong></p>
  `);

  await sendMailWithRetry(transporter, {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: `Trip Schedule Updated – Booking ${bookingId} 🚌`,
    html,
  });
};
