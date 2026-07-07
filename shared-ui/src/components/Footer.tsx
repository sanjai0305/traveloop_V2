import React from "react";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  sections?: FooterSection[];
  showSocialLinks?: boolean;
  showContactInfo?: boolean;
  copyright?: string;
  className?: string;
}

const defaultSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Security", href: "#security" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "#blog" },
      { label: "Help Center", href: "#help" },
      { label: "Documentation", href: "#docs" },
    ],
  },
];

export const Footer: React.FC<FooterProps> = ({
  sections = defaultSections,
  showSocialLinks = true,
  showContactInfo = true,
  copyright = "© 2024 Traveloop. All rights reserved.",
  className = "",
}) => {
  const socialLinks = [
    { icon: Facebook, href: "#facebook", label: "Facebook" },
    { icon: Twitter, href: "#twitter", label: "Twitter" },
    { icon: Instagram, href: "#instagram", label: "Instagram" },
    { icon: Linkedin, href: "#linkedin", label: "LinkedIn" },
  ];

  return (
    <footer className={`bg-surface-2 border-t border-border mt-auto ${className}`}>
      <div className="traveloop-container py-12">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-heading-md font-bold text-text-primary mb-4">
              Traveloop
            </h3>
            <p className="text-body-sm text-text-secondary mb-4">
              Your trusted travel companion for seamless journeys.
            </p>
            {showContactInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-body-sm text-text-secondary">
                  <Mail className="w-4 h-4" />
                  <span>support@traveloop.com</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-text-secondary">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-text-secondary">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            )}
          </div>

          {/* Link Sections */}
          {sections.map((section, index) => (
            <div key={index}>
              <h4 className="text-heading-sm font-semibold text-text-primary mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-body-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-body-sm text-text-secondary">
            {copyright}
          </p>
          
          {showSocialLinks && (
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 rounded-lg hover:bg-surface-3 transition-colors touch-target"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-text-secondary" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
