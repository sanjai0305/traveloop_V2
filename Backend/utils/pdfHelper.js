import PDFDocument from "pdfkit";

/**
 * Generates a professional PDF document from trip data and writes it to a writable stream.
 * @param {Object} data - Contains trip, itinerary, notes, checklist, flights, journals, activeBudget
 * @param {stream.Writable} stream - Writable stream to pipe PDF content to.
 */
export const generateTripPDF = (data, stream) => {
  const { trip, itinerary, notes, checklist, flights, journals, activeBudget } = data;
  const doc = new PDFDocument({ margin: 50, bufferPages: true });
  doc.pipe(stream);

  // Colors
  const primaryColor = "#4F46E5"; // Indigo-600
  const secondaryColor = "#1E293B"; // Slate-800
  const lightBg = "#F8FAFC"; // Slate-50
  const textMuted = "#64748B"; // Slate-500
  const dividerColor = "#E2E8F0"; // Slate-200

  // 1. Title Block
  doc.fillColor(primaryColor).fontSize(28).font("Helvetica-Bold").text("TRAVELOOP TRIP REPORT", { align: "center" });
  doc.moveDown(0.3);
  doc.fillColor(secondaryColor).fontSize(18).font("Helvetica").text((trip.title || "").toUpperCase(), { align: "center" });
  doc.moveDown(0.5);
  doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(1.2);

  // Trip Summary Info
  doc.fillColor(secondaryColor).fontSize(11).font("Helvetica-Bold").text("Destination: ", { continued: true });
  doc.font("Helvetica").text(trip.destinationName || trip.destination || "Not Specified");
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").text("Dates: ", { continued: true });
  doc.font("Helvetica").text(`${trip.startDate || "N/A"} to ${trip.endDate || "N/A"}`);
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold").text("Travelers: ", { continued: true });
  doc.font("Helvetica").text(`${trip.travelers || 1}`);
  if (trip.description) {
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").text("Description: ", { continued: true });
    doc.font("Helvetica").text(trip.description);
  }
  doc.moveDown(1.5);

  // 2. Active Budget Section
  if (activeBudget) {
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("ACTIVE BUDGET OVERVIEW");
    doc.moveDown(0.5);

    const boxY = doc.y;
    doc.rect(50, boxY, 512, 60).fill(lightBg);
    
    const formatCurrency = (val) => {
      return `${activeBudget.currency || "INR"} ${Number(val).toLocaleString()}`;
    };

    doc.fillColor(secondaryColor).fontSize(8).font("Helvetica-Bold");
    doc.text("Total Budget", 65, boxY + 12);
    doc.text("Planned Expenses", 165, boxY + 12);
    doc.text("Actual Expenses", 270, boxY + 12);
    doc.text("Remaining Budget", 375, boxY + 12);
    doc.text("Utilization", 480, boxY + 12);

    doc.font("Helvetica").fontSize(10);
    doc.text(formatCurrency(activeBudget.totalBudget), 65, boxY + 30);
    doc.text(formatCurrency(activeBudget.plannedExpense), 165, boxY + 30);
    doc.text(formatCurrency(activeBudget.actualExpense), 270, boxY + 30);
    doc.text(formatCurrency(activeBudget.remainingBudget), 375, boxY + 30);
    doc.text(`${(activeBudget.utilizationPercentage || 0).toFixed(1)}%`, 480, boxY + 30);

    doc.y = boxY + 75;
    doc.moveDown(0.5);

    // Categories Breakdown Table
    doc.fillColor(secondaryColor).fontSize(11).font("Helvetica-Bold").text("Budget Breakdown by Category");
    doc.moveDown(0.3);
    
    const tableHeaderY = doc.y;
    doc.rect(50, tableHeaderY, 512, 18).fill("#F1F5F9");
    doc.fillColor(secondaryColor).fontSize(8).font("Helvetica-Bold");
    doc.text("Category", 65, tableHeaderY + 5);
    doc.text("Planned", 185, tableHeaderY + 5);
    doc.text("Actual", 315, tableHeaderY + 5);
    doc.text("Utilization", 455, tableHeaderY + 5);

    let currentY = tableHeaderY + 18;
    const categoriesList = activeBudget.categories ? Object.keys(activeBudget.categories.toObject ? activeBudget.categories.toObject() : activeBudget.categories) : [];
    
    for (const cat of categoriesList) {
      const p = activeBudget.categories[cat]?.planned || 0;
      const a = activeBudget.categories[cat]?.actual || 0;
      const pct = p > 0 ? (a / p) * 100 : (a > 0 ? 100 : 0);

      doc.fillColor(secondaryColor).font("Helvetica").fontSize(9);
      doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), 65, currentY + 5);
      doc.text(formatCurrency(p), 185, currentY + 5);
      doc.text(formatCurrency(a), 315, currentY + 5);
      doc.text(`${pct.toFixed(1)}%`, 455, currentY + 5);

      doc.strokeColor(dividerColor).lineWidth(0.5).moveTo(50, currentY + 18).lineTo(562, currentY + 18).stroke();
      currentY += 18;
    }
    
    doc.y = currentY + 10;
  }

  // 3. Flight Details
  if (flights && flights.length > 0) {
    doc.moveDown(1.5);
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("FLIGHT DETAILS");
    doc.moveDown(0.5);

    for (const f of flights) {
      doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text(`${f.airline} - ${f.flightNumber}`, { continued: true });
      doc.font("Helvetica").fontSize(9).fillColor(textMuted).text(`  (Status: ${f.status.toUpperCase()})`);
      doc.fillColor(secondaryColor).fontSize(9);
      doc.text(`Route: ${f.departureAirport || "N/A"} -> ${f.arrivalAirport || "N/A"}`);
      if (f.departureTime) {
        doc.text(`Departure Time: ${new Date(f.departureTime).toLocaleString()}`);
      }
      if (f.arrivalTime) {
        doc.text(`Arrival Time: ${new Date(f.arrivalTime).toLocaleString()}`);
      }
      if (f.terminal || f.gate) {
        doc.text(`Terminal: ${f.terminal || "N/A"} | Gate: ${f.gate || "N/A"}`);
      }
      doc.moveDown(0.6);
    }
  }

  // 4. Itinerary Section
  if (itinerary && itinerary.length > 0) {
    doc.addPage();
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("DAILY ITINERARY");
    doc.moveDown(0.5);

    const sortedItin = [...itinerary].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (a.time || "09:00").localeCompare(b.time || "09:00");
    });

    const daysMap = {};
    for (const item of sortedItin) {
      if (!daysMap[item.day]) daysMap[item.day] = [];
      daysMap[item.day].push(item);
    }

    for (const dayNum of Object.keys(daysMap).sort((a, b) => Number(a) - Number(b))) {
      doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold").text(`Day ${dayNum}`);
      doc.strokeColor(dividerColor).lineWidth(1).moveTo(50, doc.y + 2).lineTo(562, doc.y + 2).stroke();
      doc.moveDown(0.4);

      for (const item of daysMap[dayNum]) {
        // Safe check for page break
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }

        doc.fillColor(secondaryColor).fontSize(9).font("Helvetica-Bold").text(`[${item.time || "09:00"}] `, { continued: true });
        doc.font("Helvetica-Bold").text(item.title, { continued: true });
        doc.font("Helvetica").fillColor(textMuted).text(` (${item.category || "Activity"})`);
        
        doc.fillColor(secondaryColor).fontSize(8.5);
        if (item.place) {
          doc.text(`Place: ${item.place}`);
        }
        if (item.budget > 0) {
          doc.font("Helvetica-Bold").text(`Estimated Cost: `, { continued: true });
          doc.font("Helvetica").text(`${activeBudget?.currency || "INR"} ${item.budget.toLocaleString()}`);
        }
        if (item.note) {
          doc.text(`Note: ${item.note}`);
        }
        doc.moveDown(0.4);
      }
      doc.moveDown(0.5);
    }
  }

  // 5. Expense Items & Settlements
  if (trip.expenseItems && trip.expenseItems.length > 0) {
    doc.addPage();
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("EXPENSES & SETTLEMENTS");
    doc.moveDown(0.5);

    for (const exp of trip.expenseItems) {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }

      const amountStr = `${exp.amount} ${exp.currency}`;
      const convStr = exp.currency !== "INR" ? ` (Converted: INR ${exp.convertedAmount.toLocaleString()})` : "";
      
      doc.fillColor(secondaryColor).fontSize(9).font("Helvetica-Bold").text(`${exp.description} `, { continued: true });
      doc.font("Helvetica").fillColor(textMuted).text(`(${exp.category})`);
      doc.fillColor(secondaryColor).fontSize(8.5);
      doc.text(`Amount: ${amountStr}${convStr}`);
      doc.text(`Paid By: ${exp.paidByName || "N/A"}`);
      if (exp.participants && exp.participants.length > 0) {
        const parts = exp.participants.map(p => `${p.name} (Owes: INR ${p.amountOwed.toFixed(1)})`).join(", ");
        doc.text(`Splits: ${parts}`);
      }
      doc.moveDown(0.5);
    }

    if (trip.settlements && trip.settlements.length > 0) {
      doc.moveDown(0.8);
      doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold").text("Settlements");
      doc.moveDown(0.3);

      for (const s of trip.settlements) {
        if (doc.y > doc.page.height - 60) {
          doc.addPage();
        }
        doc.fillColor(secondaryColor).fontSize(9).font("Helvetica");
        doc.text(`${s.fromName} paid ${s.toName}: ${s.currency} ${s.amount.toLocaleString()} on ${new Date(s.date).toLocaleDateString()}`);
        doc.moveDown(0.3);
      }
    }
  }

  // 6. Checklist
  if (checklist && checklist.length > 0) {
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    } else {
      doc.moveDown(1.5);
    }
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("CHECKLIST");
    doc.moveDown(0.5);

    const categories = [...new Set(checklist.map(c => c.category || "General"))];
    for (const cat of categories) {
      doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text(cat);
      doc.moveDown(0.2);

      const items = checklist.filter(c => (c.category || "General") === cat);
      for (const item of items) {
        if (doc.y > doc.page.height - 40) {
          doc.addPage();
        }
        const checkbox = item.checked ? "[x] " : "[ ] ";
        doc.fillColor(secondaryColor).fontSize(9).font("Helvetica").text(`${checkbox} ${item.item}`);
        doc.moveDown(0.25);
      }
      doc.moveDown(0.4);
    }
  }

  // 7. Notes
  if (notes && notes.length > 0) {
    doc.addPage();
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("TRIP NOTES");
    doc.moveDown(0.5);

    for (const n of notes) {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }
      doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text(n.title);
      doc.fontSize(9).font("Helvetica").text(n.content);
      if (n.tags && n.tags.length > 0) {
        doc.fillColor(textMuted).fontSize(8).text(`Tags: ${n.tags.join(", ")}`);
      }
      doc.moveDown(0.8);
    }
  }

  // 8. Journals
  if (journals && journals.length > 0) {
    doc.addPage();
    doc.fillColor(primaryColor).fontSize(14).font("Helvetica-Bold").text("TRAVEL JOURNALS");
    doc.moveDown(0.5);

    const sortedJournals = [...journals].sort((a, b) => a.day - b.day);
    for (const j of sortedJournals) {
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }
      doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold").text(`Day ${j.day}: ${j.title}`);
      if (j.date) {
        doc.fillColor(textMuted).fontSize(8.5).font("Helvetica-Oblique").text(`Date: ${j.date}`);
      }
      doc.fillColor(secondaryColor).fontSize(9.5).font("Helvetica").text(j.content);
      if (j.highlights && j.highlights.length > 0) {
        doc.fillColor(secondaryColor).fontSize(9).font("Helvetica-Bold").text("Highlights: ", { continued: true });
        doc.font("Helvetica").text(j.highlights.join(", "));
      }
      doc.moveDown(0.8);
    }
  }

  // Page Numbers Footer
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.strokeColor(dividerColor).lineWidth(0.5).moveTo(50, doc.page.height - 40).lineTo(562, doc.page.height - 40).stroke();
    doc.fillColor(textMuted).fontSize(8).font("Helvetica").text(
      `Page ${i + 1} of ${range.count}`, 
      50, 
      doc.page.height - 30, 
      { align: "center", width: 512 }
    );
  }

  doc.end();
};
