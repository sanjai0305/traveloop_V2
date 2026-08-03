export interface TripTemplate {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  tripType: string;
  category: string;
  rating: number;
  reviewsCount: number;
  coverImage: string;
  coverImages: string[];
  gallery: string[];
  duration: string;
  originalPrice: number;
  offerPrice: number;
  totalSeats: number;
  originCity: string;
  destinations: string[];
  pickupLocation: string;
  pickupMapsLink: string;
  dropPoint: string;
  dropMapsLink: string;
  vehicleType: string;
  busNumber: string;
  amenities: string[];
  foodIncluded: boolean;
  mealsIncluded: string[];
  hotels: Array<{
    name: string;
    category: string;
    roomType: string;
    occupancy: number;
    nightStayCount: number;
    address: string;
    photos: string[];
  }>;
  itinerary: Array<{
    day: number;
    date: string;
    startLocation: string;
    departureTime: string;
    destination: string;
    arrivalTime: string;
    placesCovered: string[];
    activities: string[];
    hotelName: string;
    nightStay: string;
    notes: string;
  }>;
  includes: string[];
  excludes: string[];
  driverName?: string;
  driverPhone?: string;
  driverGmail?: string;
  driverLicenseNumber?: string;
}

export const DEMO_TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: "ooty-weekend-escape",
    title: "Ooty Weekend Escape",
    subtitle: "3 Days / 2 Nights Scenic Hill Station Adventure",
    tagline: "Experience mist-covered mountains, tea estates, botanical gardens & lake boating",
    tripType: "Adventure",
    category: "Premium",
    rating: 4.9,
    reviewsCount: 128,
    coverImage: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",
    coverImages: [
      "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
    ],
    duration: "3 Days / 2 Nights",
    originalPrice: 5999,
    offerPrice: 4999,
    totalSeats: 40,
    originCity: "Salem",
    destinations: ["Ooty", "Coonoor"],
    pickupLocation: "Salem New Bus Stand",
    pickupMapsLink: "https://maps.google.com/?q=Salem+New+Bus+Stand",
    dropPoint: "Ooty Main Bus Stand",
    dropMapsLink: "https://maps.google.com/?q=Ooty+Main+Bus+Stand",
    vehicleType: "Bus",
    busNumber: "TN-30-AZ-7788",
    amenities: ["AC", "WiFi", "Charging Port", "Blanket", "Pushback Seat", "Water Bottle"],
    foodIncluded: true,
    mealsIncluded: ["Breakfast", "Dinner"],
    hotels: [
      {
        name: "Green Valley Resort ★★★",
        category: "3 Star",
        roomType: "Double",
        occupancy: 2,
        nightStayCount: 2,
        address: "Charing Cross, Ooty",
        photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"]
      }
    ],
    itinerary: [
      {
        day: 1,
        date: "",
        startLocation: "Salem",
        departureTime: "06:00",
        destination: "Ooty",
        arrivalTime: "11:30",
        hotelName: "Green Valley Resort",
        nightStay: "Ooty",
        placesCovered: ["Botanical Garden", "Ooty Lake", "Campfire"],
        activities: ["Hotel Check-in", "Botanical Garden Walk", "Evening Campfire"],
        notes: "Departure from Salem at 6:00 AM. Check-in by noon. Evening campfire with music."
      },
      {
        day: 2,
        date: "",
        startLocation: "Ooty Hotel",
        departureTime: "08:30",
        destination: "Doddabetta & Coonoor",
        arrivalTime: "18:00",
        hotelName: "Green Valley Resort",
        nightStay: "Ooty",
        placesCovered: ["Doddabetta Peak", "Tea Estate", "Sims Park", "Boating"],
        activities: ["Doddabetta Viewpoint", "Tea Factory Tour", "Lake Boating", "Local Shopping"],
        notes: "Full day sightseeing tour including tea factory tasting and lake boating."
      },
      {
        day: 3,
        date: "",
        startLocation: "Ooty Hotel",
        departureTime: "09:00",
        destination: "Salem",
        arrivalTime: "17:00",
        hotelName: "N/A",
        nightStay: "Return Journey",
        placesCovered: ["Pine Forest", "Souvenir Market", "Return Route"],
        activities: ["Pine Forest Walk", "Chocolate & Tea Shopping", "Return Drive"],
        notes: "Morning checkout. Visit Pine Forest and homemade chocolate shops before returning to Salem."
      }
    ],
    includes: ["3 Star Hotel Stay", "AC BharatBenz Bus Transport", "Daily Breakfast", "Guide & Support", "Entry Tickets"],
    excludes: ["Lunch", "Dinner", "Personal Expenses", "Camera Fees"],
    driverName: "Ramesh Kumar",
    driverPhone: "1234567890",
    driverGmail: "ramesh.driver@gmail.com",
    driverLicenseNumber: "TN-30-2021-99881"
  },
  {
    id: "kodaikanal-hill-retreat",
    title: "Kodaikanal Hill Retreat",
    subtitle: "2 Days / 1 Night Family Mountain Getaway",
    tagline: "Discover Coaker's Walk, Pillar Rocks, Bryant Park & misty lakes",
    tripType: "Family",
    category: "Standard",
    rating: 4.8,
    reviewsCount: 94,
    coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    coverImages: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
    ],
    duration: "2 Days / 1 Night",
    originalPrice: 4299,
    offerPrice: 3499,
    totalSeats: 35,
    originCity: "Madurai",
    destinations: ["Kodaikanal"],
    pickupLocation: "Madurai Mattuthavani Bus Stand",
    pickupMapsLink: "https://maps.google.com/?q=Madurai+Bus+Stand",
    dropPoint: "Kodaikanal Lake Bus Point",
    dropMapsLink: "https://maps.google.com/?q=Kodaikanal+Lake",
    vehicleType: "Tempo Traveller",
    busNumber: "TN-59-BK-3344",
    amenities: ["AC", "Pushback Seat", "Music System", "First Aid"],
    foodIncluded: true,
    mealsIncluded: ["Breakfast"],
    hotels: [
      {
        name: "Pine Shelter Resort ★★★",
        category: "3 Star",
        roomType: "Family",
        occupancy: 3,
        nightStayCount: 1,
        address: "Lake Road, Kodaikanal",
        photos: ["https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"]
      }
    ],
    itinerary: [
      {
        day: 1,
        date: "",
        startLocation: "Madurai",
        departureTime: "06:30",
        destination: "Kodaikanal",
        arrivalTime: "10:30",
        hotelName: "Pine Shelter Resort",
        nightStay: "Kodaikanal",
        placesCovered: ["Bryant Park", "Coaker's Walk", "Kodai Lake"],
        activities: ["Resort Check-in", "Bryant Park Flower Show", "Coaker's Walk Viewpoint", "Cycle Ride around Lake"],
        notes: "Scenic uphill drive. Afternoon walking tours and lake cycling."
      },
      {
        day: 2,
        date: "",
        startLocation: "Kodaikanal Hotel",
        departureTime: "09:00",
        destination: "Madurai",
        arrivalTime: "18:30",
        hotelName: "N/A",
        nightStay: "Return Journey",
        placesCovered: ["Pillar Rocks", "Pine Forest", "Silver Cascade Falls"],
        activities: ["Pillar Rocks Photography", "Pine Forest Walk", "Waterfalls View", "Return Drive"],
        notes: "Morning sightseeing at Pillar Rocks and waterfalls before returning."
      }
    ],
    includes: ["Resort Stay", "Tempo Traveller Transport", "Breakfast", "Sightseeing Tour"],
    excludes: ["Lunch", "Dinner", "Personal Boating Fees"],
    driverName: "Senthil Nathan",
    driverPhone: "1234567890",
    driverGmail: "senthil.driver@gmail.com",
    driverLicenseNumber: "TN-59-2020-55442"
  },
  {
    id: "yercaud-nature-escape",
    title: "Yercaud Nature Escape",
    subtitle: "2 Days / 1 Night Budget Hill Escape",
    tagline: "Explore Shevaroy Hills, Emerald Lake, Pagoda Point & spice plantations",
    tripType: "Budget Tour",
    category: "Budget",
    rating: 4.7,
    reviewsCount: 86,
    coverImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    coverImages: [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
    ],
    duration: "2 Days / 1 Night",
    originalPrice: 3499,
    offerPrice: 2999,
    totalSeats: 40,
    originCity: "Salem",
    destinations: ["Yercaud"],
    pickupLocation: "Salem Junction Railway Station",
    pickupMapsLink: "https://maps.google.com/?q=Salem+Junction",
    dropPoint: "Yercaud Lake Bus Drop",
    dropMapsLink: "https://maps.google.com/?q=Yercaud+Lake",
    vehicleType: "Bus",
    busNumber: "TN-27-XY-1234",
    amenities: ["Non AC", "Charging Port", "Pushback Seat", "First Aid"],
    foodIncluded: false,
    mealsIncluded: [],
    hotels: [
      {
        name: "Shevaroy Hilltop Inn",
        category: "3 Star",
        roomType: "Double",
        occupancy: 2,
        nightStayCount: 1,
        address: "Loop Road, Yercaud",
        photos: ["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80"]
      }
    ],
    itinerary: [
      {
        day: 1,
        date: "",
        startLocation: "Salem",
        departureTime: "07:30",
        destination: "Yercaud",
        arrivalTime: "09:30",
        hotelName: "Shevaroy Hilltop Inn",
        nightStay: "Yercaud",
        placesCovered: ["Yercaud Lake", "Pagoda Point", "Lady's Seat"],
        activities: ["Check-in", "Lake Boating", "Pagoda Sunset Viewpoint"],
        notes: "Short 20 hairpin bend mountain drive. Sunset at Lady's Seat."
      },
      {
        day: 2,
        date: "",
        startLocation: "Yercaud Hotel",
        departureTime: "09:30",
        destination: "Salem",
        arrivalTime: "16:30",
        hotelName: "N/A",
        nightStay: "Return Journey",
        placesCovered: ["Botanical Garden", "Kiliyur Waterfalls", "Coffee Plantation"],
        activities: ["Waterfall Trek", "Plantation Walk", "Coffee Powder Shopping"],
        notes: "Trek down Kiliyur falls and coffee tasting before returning."
      }
    ],
    includes: ["Hotel Stay", "Bus Transport", "Sightseeing"],
    excludes: ["All Meals", "Entry Fees"],
    driverName: "Murugan V",
    driverPhone: "9876543212",
    driverGmail: "murugan.driver@gmail.com",
    driverLicenseNumber: "TN-27-2019-11223"
  },
  {
    id: "munnar-premium-tour",
    title: "Munnar Premium Tour",
    subtitle: "4 Days / 3 Nights Luxury Tea Garden & Wildlife Safari",
    tagline: "Endless tea estates, Mattupetty Dam, Eravikulam National Park & waterfalls",
    tripType: "Corporate",
    category: "Premium",
    rating: 4.9,
    reviewsCount: 162,
    coverImage: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
    coverImages: [
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80"
    ],
    duration: "4 Days / 3 Nights",
    originalPrice: 9999,
    offerPrice: 8499,
    totalSeats: 30,
    originCity: "Coimbatore",
    destinations: ["Munnar", "Anamudi"],
    pickupLocation: "Coimbatore Gandhipuram Bus Stand",
    pickupMapsLink: "https://maps.google.com/?q=Coimbatore+Gandhipuram",
    dropPoint: "Munnar Town Drop",
    dropMapsLink: "https://maps.google.com/?q=Munnar+Town",
    vehicleType: "Sleeper",
    busNumber: "KL-07-CS-9900",
    amenities: ["AC", "WiFi", "Charging Port", "Blanket", "TV", "Water Bottle", "GPS Tracking"],
    foodIncluded: true,
    mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
    hotels: [
      {
        name: "Munnar Tea Hills Resort ★★★★",
        category: "4 Star",
        roomType: "Suite",
        occupancy: 2,
        nightStayCount: 3,
        address: "Bison Valley Road, Munnar",
        photos: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"]
      }
    ],
    itinerary: [
      {
        day: 1,
        date: "",
        startLocation: "Coimbatore",
        departureTime: "06:00",
        destination: "Munnar",
        arrivalTime: "12:00",
        hotelName: "Munnar Tea Hills Resort",
        nightStay: "Munnar",
        placesCovered: ["Cheeyappara Waterfalls", "Tea Gardens Check-in"],
        activities: ["Scenic Drive", "Resort Welcome Drink", "Evening Tea Garden Walk"],
        notes: "Waterfall stops along Western Ghats highway."
      },
      {
        day: 2,
        date: "",
        startLocation: "Munnar Resort",
        departureTime: "08:30",
        destination: "Eravikulam National Park",
        arrivalTime: "17:30",
        hotelName: "Munnar Tea Hills Resort",
        nightStay: "Munnar",
        placesCovered: ["Eravikulam Park", "Anamudi Peak", "Tea Museum"],
        activities: ["Nilgiri Tahr Safari", "Tea Factory Demonstration", "Cultural Kathakali Show"],
        notes: "Safari ticket included. Tea processing live demo."
      },
      {
        day: 3,
        date: "",
        startLocation: "Munnar Resort",
        departureTime: "09:00",
        destination: "Mattupetty & Top Station",
        arrivalTime: "18:00",
        hotelName: "Munnar Tea Hills Resort",
        nightStay: "Munnar",
        placesCovered: ["Mattupetty Dam", "Echo Point", "Top Station View"],
        activities: ["Speed Boating", "Echo Point Calling", "Clouds Panorama Viewpoint"],
        notes: "Highest elevation viewpoint in Western Ghats."
      },
      {
        day: 4,
        date: "",
        startLocation: "Munnar Resort",
        departureTime: "10:00",
        destination: "Coimbatore",
        arrivalTime: "17:00",
        hotelName: "N/A",
        nightStay: "Return Journey",
        placesCovered: ["Spice Plantation", "Coimbatore"],
        activities: ["Organic Spice Shopping", "Return Journey"],
        notes: "Cardamom & pepper spice garden walk before return."
      }
    ],
    includes: ["4-Star Resort Stay", "AC Sleeper Coach", "All 3 Daily Meals", "National Park Entry & Safari"],
    excludes: ["Personal Shopping", "Speedboat charges"],
    driverName: "Joseph Antony",
    driverPhone: "9876543213",
    driverGmail: "joseph.driver@gmail.com",
    driverLicenseNumber: "KL-07-2018-88776"
  },
  {
    id: "goa-beach-experience",
    title: "Goa Beach Experience",
    subtitle: "5 Days / 4 Nights Sun, Sand, Beaches & Party Getaway",
    tagline: "Explore Baga Beach, Fort Aguada, Dudhsagar Waterfalls & Sunset Cruise",
    tripType: "Custom Tour",
    category: "Luxury",
    rating: 5.0,
    reviewsCount: 210,
    coverImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    coverImages: [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
    ],
    duration: "5 Days / 4 Nights",
    originalPrice: 17999,
    offerPrice: 14999,
    totalSeats: 30,
    originCity: "Chennai",
    destinations: ["North Goa", "South Goa"],
    pickupLocation: "Chennai Central Railway Station",
    pickupMapsLink: "https://maps.google.com/?q=Chennai+Central",
    dropPoint: "Panjim Bus Stand / Calangute",
    dropMapsLink: "https://maps.google.com/?q=Calangute+Goa",
    vehicleType: "Bus",
    busNumber: "GA-03-Z-8899",
    amenities: ["AC", "WiFi", "Charging Port", "Blanket", "TV", "Music System", "GPS Tracking"],
    foodIncluded: true,
    mealsIncluded: ["Breakfast"],
    hotels: [
      {
        name: "The Grand Goa Beach Resort ★★★★★",
        category: "5 Star",
        roomType: "Suite",
        occupancy: 2,
        nightStayCount: 4,
        address: "Calangute Beach Road, Goa",
        photos: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80"]
      }
    ],
    itinerary: [
      {
        day: 1,
        date: "",
        startLocation: "Chennai",
        departureTime: "16:00",
        destination: "Goa",
        arrivalTime: "09:00",
        hotelName: "Grand Goa Beach Resort",
        nightStay: "Goa",
        placesCovered: ["Calangute Beach", "Resort Pool"],
        activities: ["Overnight travel", "Check-in", "Beach relaxation", "Sunset dinner"],
        notes: "Overnight AC coach journey. Hotel check-in at 10 AM."
      },
      {
        day: 2,
        date: "",
        startLocation: "Goa Resort",
        departureTime: "09:30",
        destination: "North Goa",
        arrivalTime: "18:30",
        hotelName: "Grand Goa Beach Resort",
        nightStay: "Goa",
        placesCovered: ["Fort Aguada", "Baga Beach", "Anjuna Flea Market"],
        activities: ["Fort Aguada Lighthouse", "Water sports at Baga", "Beach Shack Party"],
        notes: "Full North Goa beach & fort tour."
      },
      {
        day: 3,
        date: "",
        startLocation: "Goa Resort",
        departureTime: "09:00",
        destination: "Dudhsagar Waterfalls",
        arrivalTime: "17:00",
        hotelName: "Grand Goa Beach Resort",
        nightStay: "Goa",
        placesCovered: ["Dudhsagar Falls", "Spice Plantation"],
        activities: ["Jeep Safari through Jungle", "Waterfall Swimming", "Buffet Spice Plantation Lunch"],
        notes: "Off-road Jeep Safari included."
      },
      {
        day: 4,
        date: "",
        startLocation: "Goa Resort",
        departureTime: "10:00",
        destination: "South Goa & Mandovi River",
        arrivalTime: "20:00",
        hotelName: "Grand Goa Beach Resort",
        nightStay: "Goa",
        placesCovered: ["Old Goa Churches", "Basilica of Bom Jesus", "Mandovi River Cruise"],
        activities: ["Heritage Church Tour", "Sunset Boat Cruise with DJ & Folk Dance"],
        notes: "1-Hour Mandovi River sunset cruise included."
      },
      {
        day: 5,
        date: "",
        startLocation: "Goa Resort",
        departureTime: "11:00",
        destination: "Chennai",
        arrivalTime: "06:00",
        hotelName: "N/A",
        nightStay: "Return Journey",
        placesCovered: ["Panjim Market", "Return Route"],
        activities: ["Cashew & Wine Shopping", "Return Journey"],
        notes: "Checkout at 11 AM. Return journey back to Chennai."
      }
    ],
    includes: ["5-Star Beach Resort", "AC Luxury Coach", "Daily Breakfast", "Jeep Safari to Dudhsagar", "Mandovi Sunset Cruise"],
    excludes: ["Water Sports Fees", "Personal Drinks & Dinner"],
    driverName: "Venkatesh D",
    driverPhone: "9876543214",
    driverGmail: "venkatesh.driver@gmail.com",
    driverLicenseNumber: "GA-03-2017-33221"
  },
  {
    id: "coorg-coffee-trail",
    title: "Coorg Coffee Trail",
    subtitle: "3 Days / 2 Nights Nature & Plantation Retreat",
    tagline: "Immerse in coffee aroma, Abbey Falls, Raja's Seat & Dubare Elephant Camp",
    tripType: "Friends",
    category: "Premium",
    rating: 4.8,
    reviewsCount: 115,
    coverImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    coverImages: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
    ],
    gallery: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
    ],
    duration: "3 Days / 2 Nights",
    originalPrice: 6999,
    offerPrice: 5999,
    totalSeats: 30,
    originCity: "Bengaluru",
    destinations: ["Madikeri", "Coorg"],
    pickupLocation: "Bengaluru Majestic Bus Stand",
    pickupMapsLink: "https://maps.google.com/?q=Bengaluru+Majestic",
    dropPoint: "Madikeri Bus Drop",
    dropMapsLink: "https://maps.google.com/?q=Madikeri+Coorg",
    vehicleType: "Tempo Traveller",
    busNumber: "KA-09-MA-4455",
    amenities: ["AC", "WiFi", "Charging Port", "Music System", "First Aid"],
    foodIncluded: true,
    mealsIncluded: ["Breakfast", "Dinner"],
    hotels: [
      {
        name: "Coffee Estate Homestay ★★★★",
        category: "4 Star",
        roomType: "Double",
        occupancy: 2,
        nightStayCount: 2,
        address: "Madikeri Road, Coorg",
        photos: ["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"]
      }
    ],
    itinerary: [
      {
        day: 1,
        date: "",
        startLocation: "Bengaluru",
        departureTime: "06:00",
        destination: "Coorg",
        arrivalTime: "12:30",
        hotelName: "Coffee Estate Homestay",
        nightStay: "Coorg",
        placesCovered: ["Bylakuppe Golden Temple", "Abbey Falls"],
        activities: ["Tibetan Monastery Visit", "Homestay Check-in", "Abbey Falls Visit", "Campfire"],
        notes: "Enroute visit Tibetan Monastery in Bylakuppe."
      },
      {
        day: 2,
        date: "",
        startLocation: "Coorg Homestay",
        departureTime: "08:00",
        destination: "Dubare & Raja's Seat",
        arrivalTime: "18:00",
        hotelName: "Coffee Estate Homestay",
        nightStay: "Coorg",
        placesCovered: ["Dubare Elephant Camp", "Coffee Plantation Walk", "Raja's Seat"],
        activities: ["Elephant Bathing & Interaction", "Guided Coffee Plantation Trek", "Raja's Seat Sunset"],
        notes: "Morning elephant interaction at River Kaveri."
      },
      {
        day: 3,
        date: "",
        startLocation: "Coorg Homestay",
        departureTime: "09:30",
        destination: "Bengaluru",
        arrivalTime: "17:30",
        hotelName: "N/A",
        nightStay: "Return Journey",
        placesCovered: ["Madikeri Fort", "Spice & Coffee Shop"],
        activities: ["Madikeri Fort View", "Fresh Coffee Beans & Spices Shopping", "Return Drive"],
        notes: "Fresh estate coffee powder shopping before returning to Bengaluru."
      }
    ],
    includes: ["Heritage Plantation Stay", "AC Tempo Traveller", "Breakfast & Dinner", "Plantation Guided Walk"],
    excludes: ["Personal Expenses", "Elephant Bathing Entry Ticket"],
    driverName: "Manjunath K",
    driverPhone: "1234567890",
    driverGmail: "manjunath.driver@gmail.com",
    driverLicenseNumber: "KA-09-2022-77665"
  }
];
