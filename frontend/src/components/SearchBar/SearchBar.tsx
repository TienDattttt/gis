import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X, Search, Navigation, MapPin } from 'lucide-react';
import './SearchBar.css';
import axios from 'axios';

interface SearchBarProps {
  onMenuClick: () => void;
  onDirectionsClick: () => void;
  directionsMode: boolean;
  searchText?: string;
  onSearchChange?: (text: string) => void;
  onClearSearch?: () => void;
  onSelectResult?: (result: any) => void;
  isLoading?: boolean;
}

interface SearchSuggestion {
  id: number;
  name: string;
  address?: string;
  type?: string;
}

export const SearchBar = ({
  onMenuClick,
  onDirectionsClick,
  directionsMode,
  searchText = '',
  onSearchChange = () => { },
  onClearSearch = () => { },
  onSelectResult = () => { },
  isLoading = false,
}: SearchBarProps) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const BASE_URL = 'http://localhost:8000';

  // Xử lý click bên ngoài để đóng gợi ý
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);

    // Nếu input rỗng, xóa gợi ý
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Tìm kiếm động khi người dùng nhập
    fetchSuggestions(value);
  };

  const fetchSuggestions = async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return; // Chỉ tìm kiếm khi có ít nhất 2 ký tự
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/locations/`, {
        params: { search: text, limit: 5 },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);

      const formattedSuggestions = data.map(item => ({
        id: item.id,
        name: item.name_vi || item.name,
        address: item.details?.address || '',
        type: item.tourism_type,
      }));

      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Lỗi khi lấy gợi ý:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    onSearchChange(suggestion.name);
    setShowSuggestions(false);
    onSelectResult(suggestion);
  };

  const handleClearSearch = () => {
    onClearSearch();
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]); // Chọn gợi ý đầu tiên nếu nhấn Enter
      }
    }
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-bar">
        <Button variant="ghost" className="menu-button" onClick={onMenuClick}>
          <Menu className="menu-icon" />
        </Button>

        <div className="search-input-container">
          {directionsMode ? (
            <div className="directions-container">
             
              <Button variant="ghost" className="close-directions" onClick={onDirectionsClick}>
                <X size={18} />
              </Button>
            </div>
          ) : (
            <div className="search-input-wrapper">
              <Input
                className="search-input"
                placeholder="Tìm kiếm địa điểm..."
                value={searchText}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                onFocus={() => searchText && suggestions.length > 0 && setShowSuggestions(true)}
              />
              {searchText && (
                <Button
                  variant="ghost"
                  className="clear-search"
                  onClick={handleClearSearch}
                  disabled={isLoading}
                >
                  <X size={18} />
                </Button>
              )}
            </div>
          )}
        </div>

        {!directionsMode && (
          <Button variant="ghost" className="directions-button" onClick={onDirectionsClick}>
            <Navigation className="directions-icon" size={20} />
          </Button>
        )}
      </div>

      {/* Gợi ý tìm kiếm */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="suggestion-item"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin size={18} className="suggestion-icon" />
              <div className="suggestion-content">
                <div className="suggestion-primary">{suggestion.name}</div>
                <div className="suggestion-secondary">{suggestion.address}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};