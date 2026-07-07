import PDFDocument from "pdfkit";

export const generateTicketPdf = (booking, trip, passengerName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A6", margin: 20 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Premium Styling Colors
      const bgColor = "#05111E";
      const cardBg = "#0B2035";
      const tealColor = "#14B8B5";
      const textColor = "#FFFFFF";
      const mutedText = "#94A3B8";

      // Draw dark background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgColor);

      // Draw header card
      doc.rect(10, 10, doc.page.width - 20, 50).fill(cardBg);
      doc.fillColor(tealColor).fontSize(16).font("Helvetica-Bold").text("TRAVELOOP PASS", 20, 20);
      doc.fillColor(mutedText).fontSize(8).font("Helvetica").text("Your Premium Voyage Awaits", 20, 38);

      // Draw Main Ticket details card
      doc.rect(10, 70, doc.page.width - 20, 220).fill(cardBg);

      // Trip Title
      doc.fillColor(tealColor).fontSize(10).font("Helvetica-Bold").text("ROUTE / VOYAGE", 20, 85);
      doc.fillColor(textColor).fontSize(12).font("Helvetica-Bold").text(trip?.title || "Premium Bus Voyage", 20, 98);

      // Passenger details
      doc.fillColor(mutedText).fontSize(8).text("PASSENGER", 20, 125);
      doc.fillColor(textColor).fontSize(10).font("Helvetica-Bold").text(passengerName || "Premium Traveler", 20, 135);

      // Seat details
      doc.fillColor(mutedText).fontSize(8).text("ASSIGNED SEAT", 150, 125);
      doc.fillColor(tealColor).fontSize(10).font("Helvetica-Bold").text(booking?.assignedSeat || booking?.seatNumber || "TBD", 150, 135);

      // Bus Number
      doc.fillColor(mutedText).fontSize(8).text("BUS NUMBER", 20, 160);
      doc.fillColor(textColor).fontSize(10).font("Helvetica-Bold").text(trip?.busNumber || "TLP-2026", 20, 170);

      // Travel Date
      doc.fillColor(mutedText).fontSize(8).text("TRAVEL DATE", 150, 160);
      const travelDate = trip?.startDate ? new Date(trip.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "TBD";
      doc.fillColor(textColor).fontSize(10).font("Helvetica-Bold").text(travelDate, 150, 170);

      // Ticket ID & Verification Code
      doc.fillColor(mutedText).fontSize(8).text("TICKET ID", 20, 200);
      doc.fillColor(textColor).fontSize(10).font("Helvetica-Bold").text(booking?.ticketId || "TLP-XXXXXX", 20, 210);

      doc.fillColor(mutedText).fontSize(8).text("VERIFICATION CODE", 150, 200);
      doc.fillColor(tealColor).fontSize(10).font("Helvetica-Bold").text(booking?.verificationCode || "TLP-XXXXXXX", 150, 210);

      // QR placeholder or note
      doc.rect(20, 240, doc.page.width - 40, 40).stroke("#1E293B");
      doc.fillColor(textColor).fontSize(9).font("Helvetica").text("Show QR pass or Verification Code on boarding.", 30, 255, { align: "center" });

      // Support Footer
      doc.fillColor(mutedText).fontSize(7).text("Need help? Reach out at support@traveloop.com", 20, 310, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
