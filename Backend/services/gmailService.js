import nodemailer from "nodemailer";

const createTransporter = async () => {
  const user = process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || "https://developers.google.com/oauthplayground";

  if (!user || !clientId || !clientSecret || !refreshToken) {
    console.warn("Gmail API configuration missing for gmailService. Check environment variables.");
    return null;
  }

  // Create OAuth2 client and obtain access token using googleapis
  const { google } = await import("googleapis");
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const accessTokenRes = await oauth2Client.getAccessToken();
    const accessToken = accessTokenRes.token;

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
    console.error("[Gmail Service] Failed to retrieve access token:", error.message);
    return null;
  }
};

export const sendSupportEmail = async (name, email, message) => {
  const transporter = await createTransporter();
  if (!transporter) {
    console.error("Support Email Failed: Gmail transporter not configured");
    throw new Error("Gmail transporter not configured");
  }

  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL;
  const timestamp = new Date().toLocaleString();

  const mailOptions = {
    from: `Traveloop Support <${process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL}>`,
    to: supportEmail,
    subject: `New Support Ticket from ${name}`,
    text: `New Support Ticket Received:

Name: ${name}
Email: ${email}
Message: ${message}
Timestamp: ${timestamp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Support Email Sent");
  } catch (error) {
    console.error("Support Email Failed:", error.message);
    throw error;
  }
};

export const sendSupportReply = async (name, email) => {
  const transporter = await createTransporter();
  if (!transporter) {
    console.error("Support Email Failed: Gmail transporter not configured");
    throw new Error("Gmail transporter not configured");
  }

  const mailOptions = {
    from: `Traveloop Support <${process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL}>`,
    to: email,
    subject: "Traveloop Support Request Received",
    text: `Thank you for contacting Traveloop.

We have received your request and our team will review it shortly.

Safe travels,
Traveloop Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Support Email Sent");
  } catch (error) {
    console.error("Support Email Failed:", error.message);
    throw error;
  }
};

export const sendInviteEmail = async ({ collaborator_email, trip_name, owner_name, role, invite_link }) => {
  const transporter = await createTransporter();
  if (!transporter) {
    console.error("Invite Email Failed: Gmail transporter not configured");
    throw new Error("Gmail transporter not configured");
  }

  const mailOptions = {
    from: `Traveloop <${process.env.EMAIL_FROM || process.env.GOOGLE_SENDER_EMAIL}>`,
    to: collaborator_email,
    subject: `Invitation to collaborate on "${trip_name}"`,
    text: `You have been invited to collaborate on a trip.

Trip:
${trip_name}

Role:
${role}

Open Traveloop to accept the invitation:
${invite_link}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Invite Email Sent");
  } catch (error) {
    console.error("Invite Email Failed:", error.message);
    throw error;
  }
};
