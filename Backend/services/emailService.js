import nodemailer from "nodemailer";
import QRCode from "qrcode";

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
  // Try SMTP first (production-grade)
  const gmailUser = process.env.GMAIL_USER || process.env.GOOGLE_SENDER_EMAIL || process.env.EMAIL_FROM;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

  if (gmailUser && gmailPass) {
    console.log("[Email Service] Attempting SMTP authentication with GMAIL_USER:", gmailUser);
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        debug: true,
        logger: true,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      console.log("[Email Service] Verifying SMTP connection...");
      await transporter.verify();
      console.log("[Email Service] SMTP connection verified successfully! Ready to send emails.");
      return transporter;
    } catch (smtpErr) {
      console.error("[Email Service] SMTP transporter verification failed:", smtpErr.message, smtpErr);
      // fallback to OAuth2
    }
  }

  // Fallback to OAuth2
  const user = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground";

  if (!user || !clientId || !clientSecret || !refreshToken) {
    console.warn("[Email Service] Gmail API configuration missing. Falling back to Mock Transporter.");
    return {
      sendMail: async (options) => {
        console.log(`[Email Service Mock] Email sent to: ${options.to}\nSubject: ${options.subject}`);
        return { messageId: "mock-id", response: "250 OK", accepted: [options.to], rejected: [] };
      }
    };
  }

  console.log("[Email Service] OAuth2 initialized");

  const { google } = await import("googleapis");
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const accessTokenRes = await oauth2Client.getAccessToken();
    const accessToken = accessTokenRes.token;
    console.log("[Email Service] Access token generated");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      debug: true,
      logger: true,
      auth: {
        type: "OAuth2",
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken,
      },
    });

    console.log("[Email Service] Verifying OAuth2 transporter connection...");
    await transporter.verify();
    console.log("[Email Service] OAuth2 transporter verified successfully!");
    return transporter;
  } catch (error) {
    console.error("[Email Service] Failed to retrieve access token or verify OAuth2:", error.message, "Falling back to Mock Transporter.");
    return {
      sendMail: async (options) => {
        console.log(`[Email Service Mock] Email sent to: ${options.to}\nSubject: ${options.subject}`);
        return { messageId: "mock-id", response: "250 OK", accepted: [options.to], rejected: [] };
      }
    };
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
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL || process.env.GMAIL_USER;

  // Flexible parameter detection (handles (to, firstName, otpCode) and (to, otpCode, firstName))
  let name = firstName || "Traveler";
  let otp = otpCode || "";

  if (firstName && /^\d{6}$/.test(firstName.toString())) {
    otp = firstName.toString();
    name = otpCode || "Driver";
  }

  // Detect if this is a driver OTP verification
  const isDriver = name.toLowerCase() !== "traveler" && name.toLowerCase() !== "agent";

  let subject = "Verify Your Traveloop Account ✈️";
  let html = "";

  if (isDriver) {
    subject = "Traveloop Driver Verification Code";
    html = `
      <div style="background-color: #05111E; padding: 40px 20px; font-family: 'Poppins', 'Inter', sans-serif; color: #FFFFFF; max-width: 500px; margin: 0 auto; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 40px; margin-bottom: 10px;">🚗</div>
          <h1 style="color: #14B8B5; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Traveloop</h1>
          <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">Driver Verification</p>
        </div>

        <div style="background-color: #0B2035; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 30px; text-align: center; margin-bottom: 24px;">
          <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: left;">Hello ${name.toUpperCase()},</p>
          <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: left;">Your verification code is:</p>
          
          <div style="background: linear-gradient(135deg, rgba(20,184,181,0.15) 0%, rgba(6,182,212,0.05) 100%); border: 1px dashed rgba(20,184,181,0.4); border-radius: 16px; padding: 20px; display: inline-block; margin: 10px auto;">
            <span style="color: #14B8B5; font-size: 36px; font-weight: 900; letter-spacing: 6px; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="color: #E2E8F0; font-size: 13px; margin-top: 24px; font-weight: 600;">This code expires in 5 minutes.</p>
        </div>

        <div style="text-align: center; font-size: 11px; color: #64748B; line-height: 1.6;">
          <p style="margin: 0; font-weight: bold; color: #94A3B8;">Traveloop Security Team</p>
        </div>
      </div>
    `;
  } else {
    html = EMAIL_TEMPLATE_WRAPPER(`
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">✈️</span>
      </div>
      <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 22px; font-weight: 700;">Verify Your Email Address</h2>
      <p>Hi ${name},</p>
      <p>Thank you for choosing <strong>Traveloop</strong>! To complete your registration and begin planning your next adventures, please use the following one-time verification code:</p>
      
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; border: 1px solid #f1f5f9;">
        <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">One-Time Verification Code</span>
        <h3 style="margin: 0; color: ${BRAND_COLOR}; font-size: 36px; font-weight: 800; letter-spacing: 6px;">${otp}</h3>
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
  }

  if (isDriver) {
    console.log("Driver OTP Generated:", otp);
    console.log("Driver OTP Email:", to);
  } else {
    console.log("[Email Service] Sending OTP email to:", to, "from:", senderEmail);
  }

  const mailOptions = {
    from: `"Traveloop Security" <${senderEmail}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await sendMailWithRetry(transporter, mailOptions);
    if (isDriver) {
      const acceptedRecipients = info.accepted;
      const rejectedRecipients = info.rejected;
      console.log("Email Sent Successfully");
      console.log(info.messageId);
      console.log(acceptedRecipients);
      console.log(rejectedRecipients);
    } else {
      console.log("[Email Service] Email sent successfully");
      console.log("[Email Service] messageId:", info.messageId);
    }
    return info;
  } catch (err) {
    if (isDriver) {
      const smtpError = err.message;
      console.log(smtpError);
    } else {
      console.error("[Email Service] sendMail error:", err.message);
    }
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

export const sendBookingConfirmationEmail = async (to, name, booking, trip, pdfBuffer) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Booking confirmation email blocked for: ${to}`);
    return false;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const travelDate = trip?.startDate
    ? new Date(trip.startDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    : "TBD";

  const depTime = trip?.departureTime ? new Date(trip.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "TBD";
  const arrTime = trip?.arrivalTime ? new Date(trip.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "TBD";
  const bookingDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN");

  // Generate inline QR Code buffer
  let qrBuffer;
  try {
    const qrData = JSON.stringify({
      bookingId: booking.bookingId || String(booking._id),
      ticketId: booking.ticketId || "",
      seatNumber: booking.assignedSeat || booking.seatNumbers?.[0] || ""
    });
    qrBuffer = await QRCode.toBuffer(qrData, {
      margin: 1,
      width: 150,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF"
      }
    });
  } catch (qrErr) {
    console.error("[Email Service] QR Code buffer generation failed:", qrErr.message);
  }

  const html = `
    <div style="background-color: #0B1325; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; max-width: 600px; margin: 0 auto;">
      
      <!-- LOGO HEADER -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #14B8A6; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">TravelLoop</h1>
        <p style="color: #64748B; margin: 4px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Premium Bus Network</p>
      </div>

      <!-- STATUS HEADER -->
      <div style="background: linear-gradient(135deg, rgba(20,184,181,0.12) 0%, rgba(6,182,212,0.04) 100%); border: 1px solid rgba(20,184,181,0.2); border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; display: block; margin-bottom: 10px;">🎉</span>
        <h2 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Booking Confirmed!</h2>
        <p style="color: #94A3B8; margin: 6px 0 0 0; font-size: 13px;">Hi <b>${name || "Traveler"}</b>, your voyage has been confirmed. See details below.</p>
      </div>

      <!-- INLINE QR CODE PASS -->
      ${qrBuffer ? `
      <div style="background-color: #0F172A; border: 1px dashed rgba(20,184,181,0.3); border-radius: 20px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <img src="cid:qrcode" style="width: 120px; height: 120px; border-radius: 8px;" alt="Boarding pass QR Code"/>
        <p style="color: #94A3B8; margin: 8px 0 0 0; font-size: 12px; font-weight: 600;">Scan this QR code during boarding</p>
      </div>
      ` : ""}

      <!-- TRIP DETAILS CARD -->
      <div style="background-color: #0F172A; border: 1px solid #1E293B; border-radius: 20px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #FFFFFF; margin: 0 0 16px 0; font-size: 14px; font-weight: 800; border-bottom: 1px solid #1E293B; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Trip Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Trip Name</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right;">${trip?.title || "Premium Bus Voyage"}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Source / Boarding</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right;">${booking.pickupLocation || trip?.pickupLocation || "Main Terminal"}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Destination</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right;">${trip?.dropPoint || trip?.destination || "Destination Drop"}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Journey Date</td>
            <td style="color: #14B8A6; padding: 8px 0; font-weight: 700; text-align: right;">${travelDate}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Departure / Arrival</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right;">${depTime} - ${arrTime}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Bus Type / Number</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right;">${trip?.busType || "AC Volvo"} (${trip?.busNumber || "TLP-2026"})</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Seat Number(s)</td>
            <td style="color: #14B8A6; padding: 8px 0; font-weight: 800; text-align: right; font-family: monospace;">Seats ${booking.seatNumbers?.join(", ") || booking.assignedSeat || "TBD"}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Total Passengers</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right;">${booking.seats || booking.travellers?.length || 1}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Booking ID</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right; font-family: monospace;">${booking.bookingId}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Payment ID</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right; font-family: monospace;">${booking.paymentId || "N/A"}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Amount Paid</td>
            <td style="color: #10B981; padding: 8px 0; font-weight: 800; text-align: right;">₹${(booking.pricePaid || booking.amountPaid || 0).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 8px 0; font-weight: 600;">Booking Date</td>
            <td style="color: #FFFFFF; padding: 8px 0; font-weight: 700; text-align: right;">${bookingDate}</td>
          </tr>
        </table>

        <!-- PASSENGERS TABLE -->
        ${(() => {
          const travellerList = (booking.travellers && booking.travellers.length > 0) ? booking.travellers : (booking.passengers || []);
          if (!travellerList.length) return '';
          const rows = travellerList.map((t, idx) =>
            `<tr style="border-bottom: 1px solid #1E293B;">
              <td style="padding: 8px 6px; color: #14B8A6; font-family: monospace; font-size: 11px; font-weight: 700;">${booking.seatNumbers?.[idx] || t.seatNumber || `S${idx+1}`}</td>
              <td style="padding: 8px 6px; color: #E2E8F0; font-size: 12px; font-weight: 600;">${t.name || "Passenger"}</td>
              <td style="padding: 8px 6px; color: #94A3B8; font-size: 11px; text-align: center;">${t.gender === "Male" ? "M" : t.gender === "Female" ? "F" : "O"}</td>
              <td style="padding: 8px 6px; color: #94A3B8; font-size: 11px; text-align: center;">${t.age || "—"} Yrs</td>
            </tr>`
          ).join('');
          return `<div style="margin-top: 14px; border-top: 1px solid #1E293B; padding-top: 12px;">
            <p style="color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Passengers</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr style="border-bottom: 1px solid #334155;">
                <th style="text-align: left; color: #475569; padding: 4px 6px; font-size: 10px; text-transform: uppercase;">Seat</th>
                <th style="text-align: left; color: #475569; padding: 4px 6px; font-size: 10px; text-transform: uppercase;">Name</th>
                <th style="text-align: center; color: #475569; padding: 4px 6px; font-size: 10px; text-transform: uppercase;">Gen</th>
                <th style="text-align: center; color: #475569; padding: 4px 6px; font-size: 10px; text-transform: uppercase;">Age</th>
              </tr>
              ${rows}
            </table>
          </div>`;
        })()}
      </div>

      <!-- IMPORTANT NOTICE -->
      <div style="background-color: #0F172A; border-left: 4px solid #14B8A6; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 12px; line-height: 1.5; color: #94A3B8;">
        <h4 style="color: #FFFFFF; margin: 0 0 8px 0; font-size: 13px; font-weight: 700;">Important Notice</h4>
        <ul style="margin: 0; padding-left: 18px; space-y: 6px;">
          <li>Please arrive at the boarding terminal at least 30 minutes before departure.</li>
          <li>Carry a valid Government-issued Photo ID card.</li>
          <li>Present the attached PDF e-ticket or Booking ID to the driver during check-in.</li>
          <li>Keep this email receipt safe for future references.</li>
        </ul>
      </div>

      <!-- ACTION BUTTONS -->
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${frontendUrl}/my-bookings/${booking.bookingId || booking._id}" style="background-color: #14B8A6; color: #FFFFFF; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 13px; margin: 6px;">View Booking</a>
        <a href="${frontendUrl}/my-trips" style="background-color: #1E293B; color: #E2E8F0; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 13px; margin: 6px; border: 1px solid #334155;">Visit My Trips</a>
      </div>

      <!-- FOOTER -->
      <div style="border-top: 1px solid #1E293B; padding-top: 20px; text-align: center; font-size: 11px; color: #64748B; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} TravelLoop. All rights reserved.</p>
        <p style="margin: 0 0 12px 0;">
          <a href="${frontendUrl}/privacy" style="color: #64748B; text-decoration: underline; margin: 0 6px;">Privacy Policy</a> | 
          <a href="${frontendUrl}/terms" style="color: #64748B; text-decoration: underline; margin: 0 6px;">Terms & Conditions</a>
        </p>
        <p style="margin: 0;">Need immediate assistance? Contact <a href="mailto:support@traveloop.app" style="color: #14B8A6; text-decoration: none; font-weight: 600;">support@traveloop.app</a></p>
      </div>
    </div>
  `;

  try {
    const attachmentsList = [
      {
        filename: `TravelLoop-Ticket-${booking.bookingId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ];

    if (qrBuffer) {
      attachmentsList.push({
        filename: "qrcode.png",
        content: qrBuffer,
        cid: "qrcode"
      });
    }

    await sendMailWithRetry(transporter, {
      from: `"TravelLoop" <${senderEmail}>`,
      to,
      subject: `TravelLoop Ticket Confirmed • Booking ${booking.bookingId}`,
      html,
      attachments: attachmentsList
    });
    return true;
  } catch (err) {
    console.error("[Email Service] Nodemailer send failed:", err.message);
    return false;
  }
};

export const sendEmailVerificationOtp = async (to, firstName, otpCode) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Outgoing OTP email blocked for: ${to}`);
    return;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;

  const html = `
    <div style="background-color: #05111E; padding: 30px; font-family: 'Poppins', 'Inter', sans-serif; color: #FFFFFF; max-width: 500px; margin: 0 auto; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #14B8B5; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Traveloop</h1>
        <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">Security Verification</p>
      </div>

      <div style="background-color: #0B2035; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 20px;">
        <h2 style="color: #FFFFFF; margin: 0 0 12px 0; font-size: 16px; font-weight: 800;">Verify Your Action</h2>
        <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin-bottom: 20px;">Hi ${firstName || 'Traveler'}, please enter the following verification code to confirm your email update. This code is valid for exactly 10 minutes.</p>
        
        <div style="background: linear-gradient(135deg, rgba(20,184,181,0.1) 0%, rgba(6,182,212,0.03) 100%); border: 1px dashed rgba(20,184,181,0.3); border-radius: 12px; padding: 16px; display: inline-block;">
          <span style="color: #14B8B5; font-size: 28px; font-weight: 900; letter-spacing: 4px; font-family: monospace;">${otpCode}</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 10px; color: #64748B;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} Traveloop. All rights reserved.</p>
        <p style="margin: 0;">If you did not request this verification, please ignore this email.</p>
      </div>
    </div>
  `;

  await sendMailWithRetry(transporter, {
    from: `"Traveloop" <${senderEmail}>`,
    to,
    subject: `Traveloop Verification Code • ${otpCode}`,
    html,
  });
};

export const sendDriverOtpEmail = async (to, otpCode) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Outgoing Driver OTP email blocked for: ${to}`);
    return;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL || process.env.GMAIL_USER;

  const html = `
    <div style="background-color: #05111E; padding: 40px 20px; font-family: 'Poppins', 'Inter', sans-serif; color: #FFFFFF; max-width: 500px; margin: 0 auto; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 40px; margin-bottom: 10px;">🚗</div>
        <h1 style="color: #14B8B5; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Traveloop</h1>
        <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">Driver Verification</p>
      </div>

      <div style="background-color: #0B2035; border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 30px; text-align: center; margin-bottom: 24px;">
        <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: left;">Driver Verification OTP: ${otpCode}</p>
        <div style="background: linear-gradient(135deg, rgba(20,184,181,0.15) 0%, rgba(6,182,212,0.05) 100%); border: 1px dashed rgba(20,184,181,0.4); border-radius: 16px; padding: 20px; display: inline-block; margin: 10px auto;">
          <span style="color: #14B8B5; font-size: 36px; font-weight: 900; letter-spacing: 6px; font-family: monospace;">${otpCode}</span>
        </div>
        <p style="color: #E2E8F0; font-size: 13px; margin-top: 24px; font-weight: 600;">Expires in 10 minutes.</p>
      </div>

      <div style="text-align: center; font-size: 11px; color: #64748B; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;">If you didn't request this code, ignore this message.</p>
        <p style="margin: 0; font-weight: bold; color: #94A3B8;">Traveloop Security Team</p>
      </div>
    </div>
  `;

  console.log("[Email Service] Sending Driver OTP email to:", to, "from:", senderEmail);
  const mailOptions = {
    from: `"Traveloop Security" <${senderEmail}>`,
    to,
    subject: "Driver Contact Verification",
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[Email Service] Email sent successfully");
    return info;
  } catch (err) {
    console.error("[Email Service] transporter.sendMail threw error:", err.message, err);
    throw err;
  }
};

export const sendAdminOtpEmail = async (to, otpCode) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Outgoing Admin OTP email blocked for: ${to}`);
    return;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL || process.env.GMAIL_USER;

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">🛡️</span>
    </div>
    <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 22px; font-weight: 700;">Admin Verification</h2>
    <p>Your Admin Verification Code is <strong>${otpCode}</strong>. Expires in 10 minutes.</p>
  `);

  const mailOptions = {
    from: `"Traveloop Admin Security" <${senderEmail}>`,
    to,
    subject: "Traveloop Admin Verification Code",
    html,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("[Email Service] sendAdminOtpEmail error:", err.message);
    throw err;
  }
};

export const sendTravelerOtpEmail = async (to, otpCode) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Outgoing Traveler OTP email blocked for: ${to}`);
    return;
  }
  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL || process.env.GMAIL_USER;

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">✈️</span>
    </div>
    <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 22px; font-weight: 700;">Account Verification</h2>
    <p>Your verification code is <strong>${otpCode}</strong>. Valid for 10 minutes.</p>
  `);

  const mailOptions = {
    from: `"Traveloop Verification" <${senderEmail}>`,
    to,
    subject: "Verify Your Traveloop Account",
    html,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("[Email Service] sendTravelerOtpEmail error:", err.message);
    throw err;
  }
};

// ─── Passenger Verification OTP ───────────────────────────────────────────────
export const sendPassengerOtpEmail = async ({ to, name, otp, phone }) => {
  if (isBlockedEmail(to)) {
    console.warn(`[Email Service] Passenger OTP email blocked for: ${to}`);
    return;
  }

  const transporter = await createTransporter();
  const senderEmail = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL || process.env.GMAIL_USER;

  const otpDigits = String(otp).split("").map(d =>
    `<span style="display:inline-block;width:38px;height:48px;line-height:48px;text-align:center;font-size:22px;font-weight:900;background:#f1f5f9;border:2px solid #e2e8f0;border-radius:10px;color:#0f172a;margin:0 3px;">${d}</span>`
  ).join("");

  const html = EMAIL_TEMPLATE_WRAPPER(`
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px;">🛡️</span>
    </div>
    <h2 style="color: #1e293b; margin-top: 0; text-align: center; font-size: 22px; font-weight: 700;">Passenger Verification</h2>
    <p style="color: #475569; text-align: center;">Hi <strong>${name || "Traveler"}</strong>,</p>
    <p style="color: #475569; text-align: center;">Use the code below to verify your mobile number <strong>${phone}</strong> for your Traveloop booking.</p>
    <div style="text-align: center; margin: 28px 0 12px;">
      ${otpDigits}
    </div>
    <p style="color: #94a3b8; text-align: center; font-size: 13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
    <p style="color: #94a3b8; text-align: center; font-size: 12px;">Once verified, you won't need to verify again for future bookings from the same account.</p>
  `);

  const mailOptions = {
    from: `"Traveloop Booking" <${senderEmail}>`,
    to,
    subject: `${otp} — Traveloop Passenger Verification Code`,
    html,
  };

  try {
    const info = await sendMailWithRetry(transporter, mailOptions);
    console.log(`[PassengerOTP] OTP email sent to ${to}. MessageId: ${info?.messageId}`);
    return info;
  } catch (err) {
    console.error("[Email Service] sendPassengerOtpEmail error:", err.message);
    throw err;
  }
};

