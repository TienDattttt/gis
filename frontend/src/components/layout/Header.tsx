
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const menuItems = [
    { name: 'Home', path: '/' },
    { 
      name: 'Tours', 
      path: '/tour-details',
      hasDropdown: true
    },
    { 
      name: 'Blog', 
      path: '/blog-grid',
      hasDropdown: true
    },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="tourigo-container">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold">
            <span className="text-tourigo-primary">Tibi</span>
            <span className={isScrolled ? 'text-tourigo-dark' : 'text-white'}>ki</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  to={item.path}
                  className={`font-medium transition-colors duration-300 flex items-center ${
                    isActive(item.path)
                      ? 'text-tourigo-primary'
                      : isScrolled 
                        ? 'text-tourigo-dark hover:text-tourigo-primary' 
                        : 'text-white hover:text-tourigo-primary'
                  }`}
                >
                  {item.name}
                  {item.hasDropdown && (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </Link>
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            
            <Link to="/sign-in">
              <Button variant="outline" className="border-2 hover:bg-white/10 bg-transparent border-white text-white">
                <User className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className={`h-6 w-6 ${isScrolled ? 'text-tourigo-dark' : 'text-white'}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isScrolled ? 'text-tourigo-dark' : 'text-white'}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden fixed inset-x-0 bg-white shadow-lg transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="py-4 px-6 space-y-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block py-2 font-medium ${
                  isActive(item.path)
                    ? 'text-tourigo-primary'
                    : 'text-tourigo-dark hover:text-tourigo-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <Link 
                to="/sign-in" 
                className="block py-2 text-center bg-tourigo-primary text-white rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
