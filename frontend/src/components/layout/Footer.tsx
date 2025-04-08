
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-tourigo-dark text-white pt-16 pb-6">
      <div className="tourigo-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link to="/" className="text-2xl font-bold mb-6 inline-block">
              <span className="text-tourigo-primary">Tour</span>igo
            </Link>
            <p className="text-gray-400 mb-6">
              Experience the world's beauty with our expertly crafted tours and vacation packages.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-white/10 hover:bg-tourigo-primary p-2 rounded-full transition-colors duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-tourigo-primary p-2 rounded-full transition-colors duration-300">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-tourigo-primary p-2 rounded-full transition-colors duration-300">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-tourigo-primary p-2 rounded-full transition-colors duration-300">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-tourigo-primary transition-colors duration-300">Home</Link>
              </li>
              <li>
                <Link to="/tour-details" className="text-gray-400 hover:text-tourigo-primary transition-colors duration-300">Tours</Link>
              </li>
              <li>
                <Link to="/blog-grid" className="text-gray-400 hover:text-tourigo-primary transition-colors duration-300">Blog</Link>
              </li>
              <li>
                <Link to="#" className="text-gray-400 hover:text-tourigo-primary transition-colors duration-300">About Us</Link>
              </li>
              <li>
                <Link to="#" className="text-gray-400 hover:text-tourigo-primary transition-colors duration-300">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-tourigo-primary shrink-0 mt-1" />
                <span className="text-gray-400">123 Travel Street, Adventure City, World</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-tourigo-primary shrink-0" />
                <span className="text-gray-400">+1 (234) 567-8901</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-tourigo-primary shrink-0" />
                <span className="text-gray-400">info@tourigo.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for travel tips and exclusive deals.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-tourigo-primary text-white"
              />
              <button
                type="submit"
                className="w-full bg-tourigo-primary hover:bg-tourigo-secondary text-white py-3 rounded-lg transition-colors duration-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-12 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Tourigo. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="#" className="text-gray-400 hover:text-tourigo-primary text-sm">
                Privacy Policy
              </Link>
              <Link to="#" className="text-gray-400 hover:text-tourigo-primary text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
