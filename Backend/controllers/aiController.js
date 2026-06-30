import Trip from "../models/Trip.js";
import Itinerary from "../models/Itinerary.js";
import Flight from "../models/Flight.js";
import Checklist from "../models/Checklist.js";
import Note from "../models/Note.js";

export const queryAI = async (req, res) => {
  try {
    const { tripId, prompt } = req.body;
    if (!tripId || !prompt) {
      return res.status(400).json({ success: false, message: "tripId and prompt are required" });
    }

    // Fetch context
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const itinerary = await Itinerary.find({ trip: tripId }).sort({ day: 1, time: 1 });
    const flights = await Flight.find({ trip: tripId }).sort({ departureTime: 1 });
    const checklist = await Checklist.find({ trip: tripId });
    const notes = await Note.find({ trip: tripId });

    // Format context for Gemini
    const context = {
      trip: {
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        description: trip.description
      },
      itinerary: itinerary.map(item => ({
        day: item.day,
        time: item.time,
        title: item.title,
        place: item.place,
        category: item.category,
        note: item.note
      })),
      flights: flights.map(f => ({
        flightNumber: f.flightNumber,
        airline: f.airline,
        departure: f.departureAirport,
        arrival: f.arrivalAirport,
        departureTime: f.departureTime,
        status: f.status
      })),
      checklist: checklist.map(c => ({
        item: c.item,
        category: c.category,
        checked: c.checked
      })),
      notes: notes.map(n => ({
        title: n.title,
        content: n.content
      }))
    };

    const systemPrompt = `You are Traveloop's AI Travel Assistant. Assist the user with recommendations, plans, or questions about their trip using the trip details context provided below. Keep your responses concise, helpful, and formatted beautifully in markdown. Do not assume or hallucinate details beyond context, but offer creative suggestions when asked.`;

    const userPrompt = `
Context:
${JSON.stringify(context, null, 2)}

User Question/Prompt:
${prompt}
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: "GEMINI_API_KEY is not configured on the server" });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              { text: userPrompt }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error details:", errorText);
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    res.json({
      success: true,
      response: responseText
    });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI response. Please try again." });
  }
};
