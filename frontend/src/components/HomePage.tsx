import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from './HeroSection';
import HowItWorks from './HowItWorks';
import ComparisonSection from './ComparisonSection';
import Testimonials from './Testimonials';
import StatsSection from './StatsSection';
import CTA from './CTA';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-container">
          <Link to="/" className="home-logo">TrialScribe</Link>
          <nav className="home-nav">
            <Link to="/app" className="nav-link">Get Started</Link>
          </nav>
        </div>
      </header>
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <ComparisonSection />
      <Testimonials />
      <CTA />
    </div>
  );
};

export default HomePage;

