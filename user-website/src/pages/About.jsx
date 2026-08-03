// src/pages/About.jsx — Desktop-First SaaS About Page

import React from "react";
import MainLayout from "../layouts/MainLayout";
import AboutSection from "../components/about/AboutSection";

const About = () => {
  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <AboutSection />
      </div>
    </MainLayout>
  );
};

export default About;
