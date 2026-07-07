< !DOCTYPE html >
    <html lang="en" class="dark">
        <head>
            <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>TravelLoop | Legal Documents</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                        <script>
                            tailwind.config = {
                                darkMode: 'class',
                            theme: {
                                extend: {
                                fontFamily: {
                                sans: ['Inter', 'sans-serif'],
                    },
                            colors: {
                                gray: {
                                850: '#1f2937',
                            900: '#111827',
                            950: '#030712',
                        },
                            cyan: {
                                400: '#22d3ee',
                            500: '#06b6d4',
                            600: '#0891b2',
                        }
                    }
                }
            }
        }
                        </script>
                        <style>
                            :root {
                                /* Light Mode Variables */
                                --bg - body: #f9fafb;
                            --text-main: #374151;
                            --text-heading: #111827;
                            --text-meta: #6b7280;
                            --border-color: #e5e7eb;
                            --link-color: #0284c7;
                            --link-hover: #0369a1;

                            --nav-item-text: #4b5563;
                            --nav-item-hover-bg: #f3f4f6;
                            --nav-item-hover-text: #111827;
                            --nav-active-bg: #ecfeff;
                            --nav-active-text: #0891b2;

                            --scrollbar-bg: #f3f4f6;
                            --scrollbar-thumb: #d1d5db;
                            --scrollbar-thumb-hover: #9ca3af;
        }

                            .dark {
                                /* Dark Mode Variables */
                                --bg - body: #030712;
                            --text-main: #d1d5db;
                            --text-heading: #ffffff;
                            --text-meta: #9ca3af;
                            --border-color: rgba(255, 255, 255, 0.1);
                            --link-color: #22d3ee;
                            --link-hover: #67e8f9;

                            --nav-item-text: #9ca3af;
                            --nav-item-hover-bg: rgba(255, 255, 255, 0.05);
                            --nav-item-hover-text: #ffffff;
                            --nav-active-bg: rgba(6, 182, 212, 0.1);
                            --nav-active-text: #22d3ee;

                            --scrollbar-bg: #030712;
                            --scrollbar-thumb: #374151;
                            --scrollbar-thumb-hover: #4b5563;
        }

                            body {
                                background - color: var(--bg-body);
                            color: var(--text-main);
                            -webkit-font-smoothing: antialiased;
                            transition: background-color 0.3s ease, color 0.3s ease;
        }

                            /* Custom Scrollbar */
                            ::-webkit-scrollbar {width: 8px; }
                            ::-webkit-scrollbar-track {background: var(--scrollbar-bg); }
                            ::-webkit-scrollbar-thumb {background: var(--scrollbar-thumb); border-radius: 4px; }
                            ::-webkit-scrollbar-thumb:hover {background: var(--scrollbar-thumb-hover); }

                            /* Document Typography Styles */
                            .doc-content h1 {
                                font - size: 2.25rem;
                            font-weight: 700;
                            color: var(--text-heading);
                            margin-bottom: 0.5rem;
                            letter-spacing: -0.025em;
        }

                            .doc-content .meta {
                                font - size: 0.875rem;
                            color: var(--text-meta);
                            margin-bottom: 3rem;
                            display: flex;
                            gap: 1rem;
        }

                            .doc-content h2 {
                                font - size: 1.5rem;
                            font-weight: 600;
                            color: var(--text-heading);
                            margin-top: 3rem;
                            margin-bottom: 1rem;
                            padding-bottom: 0.5rem;
                            border-bottom: 1px solid var(--border-color);
        }

                            .doc-content h3 {
                                font - size: 1.125rem;
                            font-weight: 600;
                            color: var(--text-heading);
                            margin-top: 2rem;
                            margin-bottom: 0.75rem;
        }

                            .doc-content p {
                                line - height: 1.75;
                            margin-bottom: 1.25rem;
                            color: var(--text-main);
        }

                            .doc-content ul {
                                list - style - type: disc;
                            padding-left: 1.25rem;
                            margin-bottom: 1.5rem;
                            color: var(--text-main);
                            line-height: 1.75;
        }

                            .doc-content li {margin - bottom: 0.5rem; }

                            .doc-content strong {
                                color: var(--text-heading);
                            font-weight: 600;
        }

                            .doc-content a {
                                color: var(--link-color);
                            text-decoration: none;
                            transition: color 0.2s;
        }

                            .doc-content a:hover {
                                color: var(--link-hover);
                            text-decoration: underline;
        }

                            /* Navigation Styles mapped to variables */
                            .nav-item {
                                color: var(--nav-item-text);
                            border-left: 3px solid transparent;
        }
                            .nav-item:hover {
                                background - color: var(--nav-item-hover-bg);
                            color: var(--nav-item-hover-text);
        }
                            .nav-item.active {
                                background - color: var(--nav-active-bg);
                            color: var(--nav-active-text);
                            border-left: 3px solid #06b6d4; /* Keep cyan accent */
        }
                        </style>
                    </head>
                    <body class="flex flex-col min-h-screen">

                        <!-- Header -->
                        <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
                            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 text-sm">
                                        TL
                                    </div>
                                    <span class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">TravelLoop</span>
                                    <span class="hidden sm:inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 ml-2 border border-gray-200 dark:border-white/5">Legal</span>
                                </div>

                                <div class="flex items-center space-x-4">
                                    <!-- Theme Toggle Button -->
                                    <button id="theme-toggle" class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors" aria-label="Toggle Dark Mode">
                                        <!-- Sun Icon (Hidden in Light Mode) -->
                                        <svg id="theme-toggle-light-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 4.22a1 1 0 011.415 0l.708.708a1 1 0 01-1.414 1.415l-.708-.708a1 1 0 010-1.415zm3.78 3.78a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-4.22a1 1 0 01-1.415 0l-.708-.708a1 1 0 011.414-1.415l.708.708a1 1 0 010 1.415zM3 10a1 1 0 01-1 1H1a1 1 0 110-2h1a1 1 0 011 1zM7 10a3 3 0 116 0 3 3 0 01-6 0z"></path></svg>
                                        <!-- Moon Icon (Hidden in Dark Mode) -->
                                        <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                                    </button>

                                    <a href="#" class="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Return to Homepage</a>
                                </div>
                            </div>
                        </header>

                        <!-- Main Content Grid -->
                        <div class="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row">

                            <!-- Sidebar Navigation -->
                            <aside class="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-950/50 pt-6 px-4 md:h-[calc(100vh-4rem)] md:sticky md:top-16 overflow-y-auto transition-colors duration-300">
                                <nav class="space-y-1 mb-6">
                                    <p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Documents</p>
                                    <button onclick="switchDoc('privacy')" id="nav-privacy" class="nav-item active w-full text-left px-3 py-2.5 rounded-r-lg text-sm font-medium transition-all">
                                        Privacy Policy
                                    </button>
                                    <button onclick="switchDoc('terms')" id="nav-terms" class="nav-item w-full text-left px-3 py-2.5 rounded-r-lg text-sm font-medium transition-all">
                                        Terms & Conditions
                                    </button>
                                </nav>
                                <div class="px-3 py-4 mt-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 transition-colors duration-300">
                                    <p class="text-xs text-blue-800 dark:text-blue-300/80 leading-relaxed">
                                        By using TravelLoop, you agree to these legally binding documents. Both documents comply with global standards including GDPR and the DPDP Act.
                                    </p>
                                </div>
                            </aside>

                            <!-- Document Content Area -->
                            <main class="flex-1 px-4 py-8 sm:px-8 md:py-12 max-w-4xl">

                                <!-- Privacy Policy Document -->
                                <article id="doc-privacy" class="doc-content fade-in">
                                    <h1>TravelLoop Privacy Policy</h1>
                                    <div class="meta">
                                        <span><strong>Version:</strong> v1.0</span>
                                        <span><strong>Last Updated:</strong> July 2026</span>
                                    </div>

                                    <h2>1. Introduction</h2>
                                    <p>Welcome to TravelLoop ("Platform", "we", "our", or "us"). TravelLoop provides a comprehensive travel technology ecosystem encompassing a B2C consumer application and a B2B Agent Portal. This Privacy Policy outlines our practices regarding the collection, storage, processing, transfer, and protection of personal data when you use our website, mobile applications, and associated services (collectively, the "Services").</p>
                                    <p>This Privacy Policy is designed to comply with global data protection standards, drawing inspiration from the General Data Protection Regulation (GDPR) and the Digital Personal Data Protection Act (DPDP Act) of India. It applies to all users of the Platform, including Travelers, Travel Agencies, Tour Operators, Drivers, and Administrators.</p>

                                    <h2>2. User Consent</h2>
                                    <p>Access to the TravelLoop Platform is strictly conditional upon your explicit consent to our data practices. Users must explicitly accept this Privacy Policy and the Terms & Conditions before accessing or utilizing any features of TravelLoop.</p>
                                    <p>Upon registration and acceptance, your consent is cryptographically logged and securely stored in our databases with the following data points to ensure unrepudiated compliance:</p>
                                    <ul>
                                        <li><code>acceptedPrivacyPolicy</code>: (Boolean)</li>
                                        <li><code>acceptedTerms</code>: (Boolean)</li>
                                        <li><code>policyVersion</code>: "v1.0"</li>
                                        <li><code>privacyAcceptedAt</code>: (Timestamp)</li>
                                        <li><code>termsAcceptedAt</code>: (Timestamp)</li>
                                        <li><code>consentIp</code>: (IP Address)</li>
                                        <li><code>consentDevice</code>: (Device/Browser Fingerprint)</li>
                                    </ul>

                                    <h2>3. Information Collected</h2>
                                    <p>We collect various categories of information to provide, secure, and enhance the TravelLoop ecosystem.</p>

                                    <h3>3.1. Personal Information</h3>
                                    <p>When you create an account, complete KYC verification (for B2B agents), or make a booking, we collect:</p>
                                    <ul>
                                        <li>Full name, date of birth, and gender.</li>
                                        <li>Government-issued identification (for Agent KYC and passenger manifests).</li>
                                        <li>Contact details, including email address, phone number, and residential/business address.</li>
                                    </ul>

                                    <h3>3.2. Authentication Data</h3>
                                    <p>To ensure secure access, we collect and process authentication metrics via Firebase Authentication and custom JWT infrastructure:</p>
                                    <ul>
                                        <li>Google Authentication tokens and profile data (if signing in via Google).</li>
                                        <li>Email and password hashes.</li>
                                        <li>One-Time Password (OTP) verification logs.</li>
                                        <li>JSON Web Token (JWT) session data.</li>
                                    </ul>

                                    <h3>3.3. Booking and Travel Information</h3>
                                    <p>To facilitate our core marketplace operations, we collect detailed itinerary data:</p>
                                    <ul>
                                        <li>Trip schedules, seat selection preferences, and allocated Trip Slots.</li>
                                        <li>QR Boarding Pass generation data and scan timestamps.</li>
                                        <li>Travel itineraries, layovers, and accommodation preferences.</li>
                                    </ul>

                                    <h3>3.4. Passenger Information</h3>
                                    <p>For group bookings or B2B operator functions:</p>
                                    <ul>
                                        <li>Passenger manifest details (names, ages, contact info for co-travelers).</li>
                                        <li>Emergency contact information.</li>
                                    </ul>

                                    <h3>3.5. Location Information</h3>
                                    <p>With your consent, we utilize Google Maps API integrations to collect precise GPS location for driver tracking and live itinerary updates, and approximate location for localization and fraud prevention.</p>

                                    <h3>3.6. Platform Usage and Behavioral Data</h3>
                                    <ul>
                                        <li><strong>Wishlists & Travel Journals:</strong> Destinations saved, journal entries, and media attached.</li>
                                        <li><strong>Expense Data & Packing Lists:</strong> User-generated financial tracking and itemized packing inputs.</li>
                                        <li><strong>Media Uploads:</strong> Images and documents processed via Cloudinary.</li>
                                    </ul>

                                    <h2>4. How Information Is Used</h2>
                                    <p>We utilize the collected data strictly for operational and commercial purposes including Booking Processing, Authentication & RBAC, Fraud Prevention, Customer Support, Real-time Notifications, Agent Commission & KYC, and AI Travel Suggestions.</p>

                                    <h3>4.1. AI Features and Recommendations</h3>
                                    <p>TravelLoop employs an advanced AI Recommendation Engine. We process your browsing history, wishlists, past bookings, and travel journals to generate personalized travel itineraries, intelligent packing lists, and dynamic seat selection suggestions. This data is anonymized where possible before being fed into our machine learning models.</p>

                                    <h2>5. Security Measures</h2>
                                    <p>TravelLoop implements enterprise-grade security protocols to safeguard your data:</p>
                                    <ul>
                                        <li><strong>Authentication & Authorization:</strong> Firebase Authentication coupled with state-less JWT.</li>
                                        <li><strong>Role-Based Access Control (RBAC):</strong> Strict logical separation between user roles.</li>
                                        <li><strong>Encryption:</strong> TLS 1.3 for data in transit; AES-256 for data at rest.</li>
                                        <li><strong>Secure Storage:</strong> Database hosted on MongoDB Atlas utilizing advanced security.</li>
                                    </ul>

                                    <h2>6. Data Sharing and Third-Party Services</h2>
                                    <p>To provide a seamless ecosystem, we integrate with carefully vetted third-party processors. We do not sell your personal data. Data is shared with: Google Maps API, Firebase, MongoDB Atlas, Cloudinary, Razorpay, SMTP Providers, and Socket.io Infrastructure.</p>

                                    <h2>7. Retention Policy</h2>
                                    <p>We retain personal information only for as long as necessary. Active account data is retained for the lifetime of the account. Financial records are retained for a minimum of 7 years, and B2B Agent KYC for 5 years post-account termination.</p>

                                    <h2>8. User Rights</h2>
                                    <p>In alignment with global privacy frameworks, you possess the right to Account Deletion, Data Export (Portability), Consent Withdrawal, and Rectification.</p>

                                    <h2>9. Compliance</h2>
                                    <p>This Privacy Policy has been architected to adhere to the core tenets of the <strong>GDPR</strong> and the <strong>India Digital Personal Data Protection (DPDP) Act</strong>.</p>

                                    <h2>10. Contact Information</h2>
                                    <p>For privacy-related inquiries, data export requests, or to contact our Data Protection Officer (DPO), please reach out to:<br>
                                        <strong>Email:</strong> privacy@travelloop.com<br>
                                            <strong>Address:</strong> TravelLoop Legal & Compliance Department, Salem, Tamil Nadu, India.</p>

                                        <div class="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
                                            This document is intended for production deployment, legal publication, compliance review, and enterprise software documentation.
                                        </div>
                                    </article>

                                        <!-- Terms & Conditions Document -->
                                        <article id="doc-terms" class="doc-content hidden">
                                            <h1>TravelLoop Terms & Conditions</h1>
                                            <div class="meta">
                                                <span><strong>Version:</strong> v1.0</span>
                                                <span><strong>Last Updated:</strong> July 2026</span>
                                            </div>

                                            <h2>1. Acceptance of Terms</h2>
                                            <p>Welcome to TravelLoop ("Platform", "we", "our", or "us"). By registering for an account, accessing the B2C marketplace, or utilizing the B2B Agent Portal, you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to all terms and conditions specified herein, you must strictly abstain from using the TravelLoop ecosystem.</p>

                                            <h3>1.1. User Consent Mechanism</h3>
                                            <p>Users must explicitly accept these Terms and our Privacy Policy before accessing TravelLoop. Consent is logged irrevocably in our systems, recording the <code>policyVersion</code>, timestamp (<code>termsAcceptedAt</code>), <code>consentIp</code>, and <code>consentDevice</code> to ensure robust compliance and dispute resolution.</p>

                                            <h2>2. Eligibility</h2>
                                            <p>To utilize the TravelLoop platform, you must be at least 18 years of age or the age of legal majority in your jurisdiction. By creating an account, you represent and warrant that you possess the legal authority to form a binding contract.</p>

                                            <h2>3. Account Registration and Authentication</h2>

                                            <h3>3.1. Account Types</h3>
                                            <p>TravelLoop supports multifaceted user roles, including Travelers, Travel Agencies, Tour Operators, Drivers, and Administrators. Features available to you will depend on your provisioned Role-Based Access Control (RBAC) profile.</p>

                                            <h3>3.2. Registration Methods</h3>
                                            <p>Users may register via Google Login (OAuth 2.0), Standard Email (OTP Verification), or Mobile Number (SMS OTP Verification).</p>

                                            <h3>3.3. Security</h3>
                                            <p>You are responsible for safeguarding your login credentials. TravelLoop utilizes Firebase Authentication and JWT (JSON Web Tokens) for session management. Any activity occurring under your account is solely your responsibility.</p>

                                            <h3>3.4. B2B Agent KYC (Know Your Customer)</h3>
                                            <p>Travel Agencies and Tour Operators must complete our mandatory KYC process before their Agent Portal is activated. Failure to provide accurate corporate and tax documentation may result in immediate account suspension and freezing of wallet funds.</p>

                                            <h2>4. Bookings, Travel Packages, and Seat Allocation</h2>

                                            <h3>4.1. Platform Role</h3>
                                            <p>TravelLoop acts as a technology intermediary bridging travelers with tour operators and travel agencies. We are not a transport operator.</p>

                                            <h3>4.2. Bookings and Seat Allocation</h3>
                                            <p>All bookings are subject to availability. Real-time seat selection is facilitated through our interactive UI. Once a booking is confirmed, a specific Trip Slot and seat allocation are permanently assigned to the user.</p>

                                            <h3>4.3. QR Boarding Passes</h3>
                                            <p>Upon successful payment, TravelLoop generates a dynamic, cryptographically signed QR Boarding Pass. This QR code must be presented to the Driver or Tour Operator for scanning at the time of boarding. Duplication or tampering with the QR Boarding Pass is strictly prohibited and constitutes fraud.</p>

                                            <h2>5. Pricing, Payments, and Fees</h2>

                                            <h3>5.1. Payment Processing</h3>
                                            <p>All financial transactions on TravelLoop are processed securely through our authorized Payment Gateway Integration partner, Razorpay.</p>

                                            <h3>5.2. Pricing and Taxes</h3>
                                            <p>Prices displayed for Travel Packages are inclusive of standard operator fees but may be subject to additional platform Convenience Fees and applicable governmental Taxes (e.g., GST/VAT), which will be clearly itemized at checkout.</p>

                                            <h3>5.3. Wallet System</h3>
                                            <p>Users may load funds into their TravelLoop Wallet. Wallet balances are non-transferable outside the platform and can only be used for platform bookings. Travel Agencies utilize the Wallet System to receive commissions and process Withdrawal requests.</p>

                                            <h2>6. Refunds and Cancellations</h2>
                                            <p>Refund and cancellation policies are set by the respective Tour Operators. However, TravelLoop enforces a standard minimum cancellation SLA:</p>
                                            <ul>
                                                <li><strong>48 hours prior to the Trip Slot:</strong> Eligible for a refund (minus platform convenience fees).</li>
                                                <li><strong>Within 24 hours:</strong> Subject to operator-specific penalties, up to 100% forfeiture.</li>
                                            </ul>
                                            <p>Refunds are processed back to the original payment method or the user's TravelLoop Wallet within 5-7 business days.</p>

                                            <h2>7. User Responsibilities and Travel Rules</h2>

                                            <h3>7.1. Passenger Conduct</h3>
                                            <p>Travelers must adhere to standard safety protocols, arrive at the designated boarding point 15 minutes prior to departure, and exhibit respectful behavior toward Drivers, operators, and fellow passengers.</p>

                                            <h3>7.2. Prohibited Activities</h3>
                                            <p>Users may not scrape or reverse-engineer the platform, utilize automated bots to secure bookings, or engage in any form of payment fraud or chargeback abuse.</p>

                                            <h3>7.3. Manifest Confidentiality</h3>
                                            <p>B2B users, Agents, and Drivers handling the Passenger Manifest Management system must treat all traveler data with the utmost confidentiality. Unauthorized sharing of manifest data is a material breach of these Terms.</p>

                                            <h2>8. Platform Features and Disclaimers</h2>

                                            <h3>8.1. AI Recommendation Disclaimer</h3>
                                            <p>TravelLoop incorporates an AI Recommendation Engine. These AI-generated outputs are provided for convenience and inspiration only. We make no warranties regarding the absolute accuracy, safety, or suitability of AI-suggested routes or destinations.</p>

                                            <h3>8.2. Third-Party Services Disclaimer</h3>
                                            <p>Features relying on third parties (e.g., Google Maps, SMTP services, Cloudinary) are subject to the uptime and reliability of those providers.</p>

                                            <h2>9. Intellectual Property</h2>
                                            <p>All source code, UI/UX designs, logos, and proprietary algorithms are the exclusive intellectual property of TravelLoop. By utilizing features like Travel Journals, you grant TravelLoop a license to host and display this content.</p>

                                            <h2>10. Limitation of Liability & Force Majeure</h2>
                                            <p>TravelLoop shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the Platform. TravelLoop is also not liable for failures resulting from events beyond our reasonable control (Force Majeure).</p>

                                            <h2>11. Dispute Resolution and Governing Law</h2>
                                            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or platform usage shall be resolved through binding arbitration before seeking recourse in courts.</p>

                                            <h2>12. Contact Information</h2>
                                            <p>For legal inquiries, dispute resolution, or B2B contract clarifications, please contact our legal team:<br>
                                                <strong>Email:</strong> legal@travelloop.com<br>
                                                    <strong>Address:</strong> TravelLoop Legal Department, Salem, Tamil Nadu, India.</p>

                                                <div class="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
                                                    This document is intended for production deployment, legal publication, compliance review, and enterprise software documentation.
                                                </div>
                                            </article>

                                            </main>
                                        </div>

                                        <script>
        // DOM Elements
                                            const docPrivacy = document.getElementById('doc-privacy');
                                            const docTerms = document.getElementById('doc-terms');
                                            const navPrivacy = document.getElementById('nav-privacy');
                                            const navTerms = document.getElementById('nav-terms');

                                            // Theme Elements
                                            const themeToggleBtn = document.getElementById('theme-toggle');
                                            const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
                                            const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

                                            // Function to switch between documents
                                            function switchDoc(docType) {
                                                // Because CSS handles the `.active` styling via variables, we just toggle the class.
                                                navPrivacy.classList.remove('active');
                                            navTerms.classList.remove('active');

                                            // Hide both documents
                                            docPrivacy.classList.add('hidden');
                                            docTerms.classList.add('hidden');

                                            // Show selected document and update nav state
                                            if (docType === 'privacy') {
                                                docPrivacy.classList.remove('hidden');
                                            navPrivacy.classList.add('active');
                                            window.scrollTo({top: 0, behavior: 'smooth' });
            } else if (docType === 'terms') {
                                                docTerms.classList.remove('hidden');
                                            navTerms.classList.add('active');
                                            window.scrollTo({top: 0, behavior: 'smooth' });
            }
        }

                                            // Theme Management Logic
                                            function updateThemeIcons() {
            if (document.documentElement.classList.contains('dark')) {
                                                themeToggleLightIcon.classList.remove('hidden');
                                            themeToggleDarkIcon.classList.add('hidden');
            } else {
                                                themeToggleLightIcon.classList.add('hidden');
                                            themeToggleDarkIcon.classList.remove('hidden');
            }
        }

                                            function toggleTheme() {
            // Toggle the 'dark' class on the HTML element
            if (document.documentElement.classList.contains('dark')) {
                                                document.documentElement.classList.remove('dark');
                                            localStorage.setItem('color-theme', 'light');
            } else {
                                                document.documentElement.classList.add('dark');
                                            localStorage.setItem('color-theme', 'dark');
            }
                                            updateThemeIcons();
        }

                                            // Initialize Theme on Load
                                            function initTheme() {
            // Check local storage or system preference
            if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                                                document.documentElement.classList.add('dark');
            } else {
                                                document.documentElement.classList.remove('dark');
            }
                                            updateThemeIcons();
        }

                                            // Set up event listeners
                                            themeToggleBtn.addEventListener('click', toggleTheme);

                                            // Run initialization
                                            initTheme();
                                        </script>
                                    </body>
                                </html>