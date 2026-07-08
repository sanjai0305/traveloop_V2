import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const generateTicketPdf = (booking, trip, passengerName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Generate QR Code image buffer
      // Encodes a compact JSON block of the Booking ID
      const qrData = JSON.stringify({ bookingId: booking.bookingId || String(booking._id) });
      const qrBuffer = await QRCode.toBuffer(qrData, {
        margin: 1,
        width: 100,
        color: {
          dark: "#0F172A", // slate-900
          light: "#FFFFFF"
        }
      });

      // Palette
      const brandTeal = "#14B8A6";
      const bgDark = "#0F172A";
      const bgLight = "#F8FAFC";
      const textDark = "#1E293B";
      const textMuted = "#64748B";
      const borderLight = "#E2E8F0";

      // ─── HEADER banner ───
      doc.rect(40, 40, 515, 95).fill(bgDark);
      
      // TravelLoop Logo
      doc.fillColor(brandTeal).fontSize(22).font("Helvetica-Bold").text("TravelLoop", 60, 55);
      doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica").text("PREMIUM VOYAGE PASS", 60, 80);
      doc.fillColor("#94A3B8").fontSize(8).font("Helvetica").text(`PAYMENT STATUS: ${booking.paymentStatus || "PAID"}`, 60, 105);

      // Booking Confirmed Badge
      doc.rect(400, 50, 135, 18).fill("#10B981");
      doc.fillColor("#FFFFFF").fontSize(7.5).font("Helvetica-Bold").text("BOOKING CONFIRMED", 400, 55, { width: 135, align: "center" });

      // Booking ID
      doc.fillColor("#94A3B8").fontSize(7.5).font("Helvetica").text("BOOKING ID", 400, 73);
      doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold").text(booking.bookingId || "N/A", 400, 81);

      // Transaction ID
      doc.fillColor("#94A3B8").fontSize(7.5).font("Helvetica").text("TRANSACTION ID", 400, 93);
      doc.fillColor("#FFFFFF").fontSize(8.5).font("Helvetica-Bold").text(booking.paymentId || "N/A", 400, 101);

      // ─── JOURNEY DETAILS ───
      doc.fillColor(textDark).fontSize(12).font("Helvetica-Bold").text("JOURNEY DETAILS", 40, 145);
      doc.strokeColor(borderLight).lineWidth(1).moveTo(40, 160).lineTo(555, 160).stroke();

      // Trip Title, Bus details, dates
      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("ROUTE / TRIP NAME", 40, 175);
      doc.fillColor(textDark).fontSize(10).font("Helvetica-Bold").text(trip?.title || "Premium Bus Journey", 40, 187);

      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("JOURNEY DATE", 250, 175);
      const travelDate = trip?.startDate ? new Date(trip.startDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "TBD";
      doc.fillColor(textDark).fontSize(10).font("Helvetica-Bold").text(travelDate, 250, 187);

      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("BUS TYPE & VEHICLE", 420, 175);
      doc.fillColor(textDark).fontSize(10).font("Helvetica-Bold").text(`${trip?.busType || "AC Sleeper"} (${trip?.busNumber || "TLP-2026"})`, 420, 187);

      // Pickup & Drop Points
      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("BOARDING POINT (REPORTING TIME: 30 MIN PRIOR)", 40, 215);
      doc.fillColor(textDark).fontSize(9).font("Helvetica-Bold").text(booking.pickupLocation || trip?.pickupLocation || "Main Bus Bay", 40, 227, { width: 230 });

      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("DROP-OFF POINT", 300, 215);
      doc.fillColor(textDark).fontSize(9).font("Helvetica-Bold").text(trip?.dropPoint || trip?.destination || "Drop Terminus", 300, 227, { width: 230 });

      // Departure / Arrival Times
      const depTime = trip?.departureTime ? new Date(trip.departureTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "TBD";
      const arrTime = trip?.arrivalTime ? new Date(trip.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "TBD";

      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("DEPARTURE TIME", 40, 260);
      doc.fillColor(textDark).fontSize(10).font("Helvetica-Bold").text(depTime, 40, 272);

      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("EST. ARRIVAL TIME", 160, 260);
      doc.fillColor(textDark).fontSize(10).font("Helvetica-Bold").text(arrTime, 160, 272);

      // ─── PASSENGER & SEAT DETAILS ───
      doc.fillColor(textDark).fontSize(12).font("Helvetica-Bold").text("PASSENGERS & SEAT ASSIGNMENTS", 40, 310);
      doc.strokeColor(borderLight).lineWidth(1).moveTo(40, 325).lineTo(555, 325).stroke();

      // Header row
      doc.rect(40, 335, 515, 20).fill(bgLight);
      doc.fillColor(textMuted).fontSize(8).font("Helvetica-Bold").text("PASSENGER NAME", 50, 341);
      doc.text("AGE / GENDER", 280, 341);
      doc.text("SEAT NUMBER", 450, 341);

      // Draw each traveler
      const travellers = booking.travellers || [];
      let yOffset = 365;
      travellers.forEach((t, idx) => {
        // Draw row background for alternating rows
        if (idx % 2 === 1) {
          doc.rect(40, yOffset - 3, 515, 20).fill("#F1F5F9");
        }
        doc.fillColor(textDark).fontSize(9).font("Helvetica-Bold").text(t.name || "Traveler", 50, yOffset);
        doc.fillColor(textDark).fontSize(9).font("Helvetica").text(`${t.age || "N/A"} / ${t.gender || "Other"}`, 280, yOffset);
        doc.fillColor(brandTeal).fontSize(9).font("Helvetica-Bold").text(booking.seatNumbers?.[idx] || t.seatNumber || "TBD", 450, yOffset);
        yOffset += 20;
      });

      // ─── PAYMENT SUMMARY ───
      const paymentY = Math.max(yOffset + 20, 420);
      doc.fillColor(textDark).fontSize(12).font("Helvetica-Bold").text("PAYMENT SUMMARY", 40, paymentY);
      doc.strokeColor(borderLight).lineWidth(1).moveTo(40, paymentY + 15).lineTo(320, paymentY + 15).stroke();

      const pricePaid = booking.pricePaid || booking.amountPaid || 0;
      const baseSubtotal = Math.round(pricePaid / 1.05);
      const taxAmount = pricePaid - baseSubtotal;

      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("Fare Subtotal", 40, paymentY + 30);
      doc.fillColor(textDark).fontSize(9).font("Helvetica-Bold").text(`₹${baseSubtotal.toLocaleString("en-IN")}`, 250, paymentY + 30, { align: "right", width: 70 });

      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("GST & Taxes (5%)", 40, paymentY + 45);
      doc.fillColor(textDark).fontSize(9).font("Helvetica-Bold").text(`₹${taxAmount.toLocaleString("en-IN")}`, 250, paymentY + 45, { align: "right", width: 70 });

      doc.fillColor(textMuted).fontSize(8).font("Helvetica").text("Convenience Fee", 40, paymentY + 60);
      doc.fillColor(textDark).fontSize(9).font("Helvetica-Bold").text("₹0 (Waived)", 250, paymentY + 60, { align: "right", width: 70 });

      doc.strokeColor(borderLight).lineWidth(1).moveTo(40, paymentY + 75).lineTo(320, paymentY + 75).stroke();
      doc.fillColor(textDark).fontSize(10).font("Helvetica-Bold").text("Total Paid", 40, paymentY + 85);
      doc.fillColor(brandTeal).fontSize(12).font("Helvetica-Bold").text(`₹${pricePaid.toLocaleString("en-IN")}`, 230, paymentY + 83, { align: "right", width: 90 });

      // ─── QR CODE ───
      doc.image(qrBuffer, 440, paymentY + 10, { width: 90 });
      doc.fillColor(textMuted).fontSize(7).font("Helvetica").text("Scan during boarding", 430, paymentY + 105, { align: "center", width: 110 });

      // ─── IMPORTANT INSTRUCTIONS ───
      const instructionY = paymentY + 130;
      doc.fillColor(textDark).fontSize(10).font("Helvetica-Bold").text("IMPORTANT BOARDING INSTRUCTIONS", 40, instructionY);
      doc.strokeColor(borderLight).lineWidth(1).moveTo(40, instructionY + 12).lineTo(555, instructionY + 12).stroke();

      const instructions = [
        "Please arrive at the boarding location at least 30 minutes before the scheduled departure.",
        "Carry a valid Government-issued Photo ID (Aadhaar, PAN, Passport, etc.) for passenger verification.",
        "Show this digital e-ticket, PDF pass, or your Booking ID directly on your device during boarding.",
        "Your QR code will be scanned by the driver to mark your attendance before departure.",
        "For support, refunds, or cancellations, contact support@traveloop.app or reach out to your agent."
      ];

      let bulletY = instructionY + 25;
      instructions.forEach((inst) => {
        doc.fillColor(brandTeal).fontSize(8).text("•", 40, bulletY);
        doc.fillColor(textMuted).fontSize(8).font("Helvetica").text(inst, 52, bulletY, { width: 500 });
        bulletY += 16;
      });

      // ─── FOOTER ───
      doc.strokeColor(borderLight).lineWidth(1).moveTo(40, 750).lineTo(555, 750).stroke();
      doc.fillColor(textMuted).fontSize(7).font("Helvetica").text("TravelLoop Premium Bus Network • Terms & Conditions apply • support@traveloop.app", 40, 765, { align: "center", width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
