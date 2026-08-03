import React, { useState } from "react";
import { Shield, FileText, Lock, Building2, CheckCircle2, ChevronRight, Download, Scale } from "lucide-react";

export const LegalCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Header Banner */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Legal & Compliance Center</h1>
              <p className="text-xs text-slate-400">Enterprise policies governing the TravelLoop Agent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> DPDP Act 2023 Compliant
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              v1.0 (August 2026)
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            {/* Nav Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">Documents</h2>
              
              <button
                onClick={() => setActiveTab("terms")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
                  activeTab === "terms"
                    ? "bg-teal-500/10 border border-teal-500/30 text-teal-300 font-semibold shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 ${activeTab === "terms" ? "text-teal-400" : "text-slate-400"}`} />
                  <div>
                    <div className="text-sm font-medium">Terms & Conditions</div>
                    <div className="text-[11px] text-slate-400">Partner Agency Agreement</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === "terms" ? "text-teal-400" : "text-slate-500"}`} />
              </button>

              <button
                onClick={() => setActiveTab("privacy")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
                  activeTab === "privacy"
                    ? "bg-teal-500/10 border border-teal-500/30 text-teal-300 font-semibold shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Lock className={`w-5 h-5 ${activeTab === "privacy" ? "text-teal-400" : "text-slate-400"}`} />
                  <div>
                    <div className="text-sm font-medium">Privacy Policy</div>
                    <div className="text-[11px] text-slate-400">Data & Security Standards</div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === "privacy" ? "text-teal-400" : "text-slate-500"}`} />
              </button>
            </div>

            {/* Small Compliance Note */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Building2 className="w-4 h-4 text-teal-400" />
                Compliance & Regulatory Note
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                These documents govern the use of the TravelLoop Agent Portal by registered travel agencies and comply with applicable Indian regulations, DPDP Act 2023, and industry best practices.
              </p>
            </div>

            {/* Help / Contact Legal Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Legal Inquiries</h3>
              <p className="text-xs text-slate-400">
                Have questions regarding partner agreements or data compliance?
              </p>
              <div className="text-xs space-y-1.5 font-mono text-teal-400">
                <div>legal@travelloop.com</div>
                <div>privacy@travelloop.com</div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT AREA */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-10 backdrop-blur-sm space-y-8">
              
              {/* TERMS & CONDITIONS TAB */}
              {activeTab === "terms" && (
                <div className="space-y-8">
                  {/* Header metadata */}
                  <div className="border-b border-slate-800 pb-6 space-y-2">
                    <h2 className="text-2xl font-extrabold text-white">TravelLoop Agent Portal Terms & Conditions</h2>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-mono">
                      <span>Version: v1.0</span>
                      <span>•</span>
                      <span>Last Updated: August 2026</span>
                    </div>
                  </div>

                  {/* Document Sections */}
                  <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        1. Acceptance of Terms
                      </h3>
                      <p>
                        By registering as a TravelLoop Partner Agency ("Agent", "Agency", "Partner"), you agree to comply with these Terms & Conditions. These Terms govern your use of the TravelLoop Agent Portal, including trip creation, booking management, customer communication, payments, and related services.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">2. Agency Eligibility</h3>
                      <p>To use the Agent Portal you must:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Operate a legally registered travel agency.</li>
                        <li>Provide accurate business information.</li>
                        <li>Complete KYC verification.</li>
                        <li>Maintain valid government registrations where applicable.</li>
                        <li>Be at least 18 years old.</li>
                        <li>Accept periodic compliance reviews.</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">3. Agent Responsibilities</h3>
                      <p>Agents are responsible for:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Publishing accurate trip information.</li>
                        <li>Maintaining correct pricing.</li>
                        <li>Updating availability.</li>
                        <li>Providing genuine itineraries.</li>
                        <li>Responding to customer bookings.</li>
                        <li>Maintaining service quality.</li>
                      </ul>
                      <p className="text-xs text-amber-400/90 font-medium pt-1">
                        Misleading information may result in account suspension.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">4. Trip Publishing</h3>
                      <p>Agents may publish:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Domestic Tours</li>
                        <li>International Tours</li>
                        <li>Group Tours</li>
                        <li>Custom Packages</li>
                        <li>Adventure Trips</li>
                        <li>Pilgrimage Tours</li>
                        <li>Corporate Packages</li>
                      </ul>
                      <p className="text-xs text-slate-400 pt-1">
                        TravelLoop reserves the right to review, reject, or remove any listing violating platform policies.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">5. Pricing & Payments</h3>
                      <p>Agents must:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Display accurate prices.</li>
                        <li>Clearly disclose taxes.</li>
                        <li>Mention cancellation charges.</li>
                        <li>Honor confirmed bookings.</li>
                      </ul>
                      <p className="text-xs text-slate-400 pt-1">
                        Commission deductions and payout schedules follow the Partner Agreement.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">6. Booking Management</h3>
                      <p>Agents must:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Confirm bookings promptly.</li>
                        <li>Update itinerary changes.</li>
                        <li>Communicate delays immediately.</li>
                        <li>Resolve customer issues professionally.</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">7. Cancellations & Refunds</h3>
                      <p>Agents must maintain a transparent cancellation policy.</p>
                      <p>Refund timelines should comply with applicable regulations.</p>
                      <p>TravelLoop may intervene in disputes where necessary.</p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">8. KYC & Verification</h3>
                      <p>TravelLoop may request:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>GST Certificate</li>
                        <li>PAN</li>
                        <li>Business Registration</li>
                        <li>Address Proof</li>
                        <li>Bank Verification</li>
                        <li>Government ID</li>
                      </ul>
                      <p className="text-xs text-rose-400 font-medium pt-1">
                        Providing false documents may permanently terminate the account.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">9. Data Security</h3>
                      <p>Agents must:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Protect login credentials.</li>
                        <li>Prevent unauthorized access.</li>
                        <li>Report security incidents immediately.</li>
                        <li>Never share customer information unlawfully.</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">10. Prohibited Activities</h3>
                      <p>Agents shall not:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Publish fake trips</li>
                        <li>Manipulate pricing</li>
                        <li>Create duplicate accounts</li>
                        <li>Upload illegal content</li>
                        <li>Commit payment fraud</li>
                        <li>Abuse customers</li>
                        <li>Misuse TravelLoop branding</li>
                      </ul>
                      <p className="text-xs text-rose-400/90 font-medium pt-1">
                        Violations may result in immediate suspension.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">11. Intellectual Property</h3>
                      <p>
                        TravelLoop owns all platform software, branding, APIs, dashboards, and portal designs.
                      </p>
                      <p>
                        Agents retain ownership of their uploaded business content while granting TravelLoop permission to display it on the platform.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">12. Suspension & Termination</h3>
                      <p>TravelLoop may suspend or terminate accounts for:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Fraud</li>
                        <li>Fake bookings</li>
                        <li>Chargeback abuse</li>
                        <li>Fake KYC</li>
                        <li>Repeated customer complaints</li>
                        <li>Policy violations</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">13. Limitation of Liability</h3>
                      <p>
                        TravelLoop provides the Agent Portal "as is."
                      </p>
                      <p>
                        TravelLoop is not responsible for business losses caused by incorrect listings, force majeure events, third-party failures, or customer disputes beyond its platform responsibilities.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">14. Governing Law</h3>
                      <p>These Terms are governed by the laws of India.</p>
                      <p>Any disputes shall be subject to the jurisdiction of the courts located in Tamil Nadu, India.</p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2 pt-2">
                      <h3 className="text-base font-bold text-white">15. Contact</h3>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                        <div className="font-semibold text-white">Legal Team</div>
                        <div className="text-slate-400">TravelLoop</div>
                        <div className="text-teal-400 font-mono">legal@travelloop.com</div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* PRIVACY POLICY TAB */}
              {activeTab === "privacy" && (
                <div className="space-y-8">
                  {/* Header metadata */}
                  <div className="border-b border-slate-800 pb-6 space-y-2">
                    <h2 className="text-2xl font-extrabold text-white">TravelLoop Agent Portal Privacy Policy</h2>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-mono">
                      <span>Version: v1.0</span>
                      <span>•</span>
                      <span>Last Updated: August 2026</span>
                    </div>
                  </div>

                  {/* Document Sections */}
                  <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
                    
                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">1. Information We Collect</h3>
                      <p>We collect information required to operate and secure your Agent Portal account:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Agency Details</li>
                        <li>Contact Information</li>
                        <li>Business Registration</li>
                        <li>GST & PAN Details</li>
                        <li>Bank Information</li>
                        <li>Device Information</li>
                        <li>Login Activity</li>
                        <li>API Usage Logs</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">2. How We Use Your Information</h3>
                      <p>Collected data is used strictly for legitimate business operations:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Account Verification</li>
                        <li>KYC Processing</li>
                        <li>Fraud Prevention</li>
                        <li>Booking Management</li>
                        <li>Payment Processing</li>
                        <li>Customer Support</li>
                        <li>Security Monitoring</li>
                        <li>Legal Compliance</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">3. Information Sharing</h3>
                      <p className="font-semibold text-teal-400">We never sell agency data.</p>
                      <p>Information may only be shared with:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Payment Providers</li>
                        <li>Government Authorities (when legally required)</li>
                        <li>Cloud Infrastructure Providers</li>
                        <li>Identity Verification Services</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">4. Data Security</h3>
                      <p>We employ enterprise-grade security controls to protect agency data:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>End-to-end encrypted communication</li>
                        <li>Secure authentication</li>
                        <li>JWT-based authorization</li>
                        <li>Access logging</li>
                        <li>Regular security monitoring</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">5. Data Retention</h3>
                      <p>
                        Agency records are retained only as long as required for legal, accounting, security, or operational purposes.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">6. Cookies & Session Storage</h3>
                      <p>
                        We use essential authentication cookies, session tokens, analytics cookies, and user preferences to ensure seamless access and security management across the Agent Portal.
                      </p>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">7. Your Rights</h3>
                      <p>Agents can:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Access their information</li>
                        <li>Correct inaccuracies</li>
                        <li>Download their data</li>
                        <li>Request account deletion (subject to legal obligations)</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2">
                      <h3 className="text-base font-bold text-white">8. Compliance</h3>
                      <p>TravelLoop adheres to applicable data protection regulations including:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300">
                        <li>Digital Personal Data Protection Act (India)</li>
                        <li>GDPR (where applicable)</li>
                      </ul>
                    </section>

                    <hr className="border-slate-800/80" />

                    <section className="space-y-2 pt-2">
                      <h3 className="text-base font-bold text-white">9. Contact</h3>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                        <div className="font-semibold text-white">Privacy Team</div>
                        <div className="text-teal-400 font-mono">privacy@travelloop.com</div>
                      </div>
                    </section>

                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LegalCenter;
