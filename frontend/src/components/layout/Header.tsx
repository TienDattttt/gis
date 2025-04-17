import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    // Kiểm tra thông tin người dùng trong localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Kiểm tra trạng thái cuộn
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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);
    toast.success('Đăng xuất thành công!');
    navigate('/sign-in');
  };

  const menuItems = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Bản đồ tương tác', path: '/map', hasDropdown: true },
    { name: 'Bài viết', path: '/blog-grid', hasDropdown: true },
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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform duration-200">
                    <User className={`h-5 w-5 ${isScrolled ? 'text-tourigo-dark' : 'text-white'}`} />
                    <span
                      className={`font-medium ${
                        isScrolled ? 'text-tourigo-dark' : 'text-white'
                      }`}
                    >
                      {user.username}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      Hồ sơ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/sign-in">
                <Button
                  variant="outline"
                  className="border-2 hover:bg-white/10 bg-transparent border-white text-white"
                >
                  <User className="h-5 w-5 mr-2" />
                  Đăng nhập
                </Button>
              </Link>
            )}
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
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className={`block py-2 font-medium ${
                      isActive('/profile')
                        ? 'text-tourigo-primary'
                        : 'text-tourigo-dark hover:text-tourigo-primary'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Hồ sơ
                  </Link>
                  <div className="flex items-center py-2">
                    <User className="h-5 w-5 mr-2 text-tourigo-dark" />
                    <span className="font-medium text-tourigo-dark">{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full py-2 text-center bg-red-600 text-white rounded-lg"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/sign-in"
                  className="block py-2 text-center bg-tourigo-primary text-white rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;