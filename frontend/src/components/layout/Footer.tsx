
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
              <span className="text-tourigo-primary">Tibi</span>ki
            </Link>
            <p className="text-gray-400 mb-6">
            Tuyệt tác biển xanh vẫy gọi, khám phá ẩm thực đỉnh cao, chinh phục những cây cầu kỳ vĩ - Đà Nẵng, điểm đến không thể bỏ lỡ!
            </p>
            
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-tourigo-primary transition-colors duration-300">Home</Link>
              </li>
              <li>
                <Link to="/map" className="text-gray-400 hover:text-tourigo-primary transition-colors duration-300">Bản đồ tương tác</Link>
              </li>
              <li>
                <Link to="/blog-grid" className="text-gray-400 hover:text-tourigo-primary transition-colors duration-300">Bài viết</Link>
              </li>
             
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-tourigo-primary shrink-0 mt-1" />
                <span className="text-gray-400">263B Lê Văn Sỹ</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-tourigo-primary shrink-0" />
                <span className="text-gray-400">+1 (234) 567-8901</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-tourigo-primary shrink-0" />
                <span className="text-gray-400">1150080090@sv.hcmunre.edu.vn</span>
              </li>
            </ul>
          </div>

        
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-12 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Tibiki. All rights reserved.
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
