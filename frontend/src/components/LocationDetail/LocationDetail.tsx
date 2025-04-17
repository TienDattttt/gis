import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, BookmarkPlus, Star } from 'lucide-react';
import { Button } from '../ui/button';
import './LocationDetail.css';

interface LocationProps {
  id: number;
  name: string;
  address?: string;
  location?: [number, number] | null;
  images?: Array<{ id: number, url: string, caption?: string | null }>;
  details?: any;
  type?: string;
  distance?: number;
  rating?: number;
}

interface LocationDetailProps {
  location?: LocationProps;
  locationsList?: LocationProps[];
  onClose: () => void;
  setSelectedRouteLocation?: (location: LocationProps | null) => void; // Thêm prop để vẽ tuyến đường
}

export const LocationDetail = ({ location, locationsList, onClose, setSelectedRouteLocation }: LocationDetailProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const BASE_URL = 'http://localhost:8000';

  const handleClose = () => {
    setIsClosing(true);
  };

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const placeholderImage = "https://images.unsplash.com/photo-1545074565-53356c98b3f5?q=80&w=1000";

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    } else {
      return `${(distance / 1000).toFixed(1)} km`;
    }
  };

  const renderRating = (rating) => {
    const stars = [];
    const maxStars = 5;
    const roundedRating = Math.round(rating * 2) / 2;
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={
            i <= roundedRating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }
        />
      );
    }
    return stars;
  };

  // Xử lý click nút "Đường đi"
  const handleShowRoute = (loc: LocationProps) => {
    if (setSelectedRouteLocation) {
      setSelectedRouteLocation(loc);
    }
  };

  if (locationsList && locationsList.length > 0) {
    return (
      <div className={`location-detail ${isClosing ? 'closing' : ''}`}>
        <div className="location-content">
          <div className="location-header">
            <div className="location-name">Danh sách địa điểm</div>
            <Button variant="ghost" onClick={handleClose} className="close-button">
              <X size={20} />
            </Button>
          </div>
          <div className="locations-list">
            {locationsList.map((loc, index) => (
              <div
                key={loc.id}
                className={`location-item ${
                  index === locationsList.length - 1 ? '' : 'border-b'
                }`}
              >
                <div className="location-item-main">
                  <div className="location-item-name">{loc.name}</div>
                  <div className="location-item-meta">
                    {loc.details?.rating && (
                      <div className="location-item-rating flex items-center gap-1">
                        {renderRating(loc.details.rating)}
                        <span className="text-gray-600 text-sm ml-1">
                          ({loc.details.rating})
                        </span>
                      </div>
                    )}
                    <div className="location-item-distance">
                      {formatDistance(loc.distance)}
                    </div>
                  </div>
                  <div className="location-item-address">
                    <MapPin size={14} className="detail-icon" />
                    <span>{loc.details.basic_info?.address || 'Không có địa chỉ'}</span>
                  </div>
                </div>
                <div className="location-item-actions">
                  <button
                    className="action-button"
                    onClick={() => handleShowRoute(loc)} // Thêm sự kiện click để vẽ tuyến đường
                  >
                    <Navigation size={14} className="action-icon" />
                    Đường đi
                  </button>
                  <button className="action-button">
                    <BookmarkPlus size={14} className="action-icon" />
                    Lưu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (location) {
    const hasImages = location.images && location.images.length > 0;

    return (
      <div className={`location-detail ${isClosing ? 'closing' : ''}`}>
        <div className="location-image-container">
          <img
            src={hasImages ? `${BASE_URL}/media${location.images[0]?.url}` : placeholderImage}
            alt={location.name}
            className="location-image"
          />
          <Button variant="ghost" onClick={handleClose} className="close-button">
            <X size={20} />
          </Button>
        </div>

        <div className="location-content">
          <div className="location-header">
            <div className="location-name">{location.name}</div>
          
          </div>

          <div className="location-actions">
            <button className="action-button" onClick={() => handleShowRoute(location)}>
              <Navigation size={20} className="action-icon" color="#1a73e8" />
              Đường đi
            </button>
            <button className="action-button">
              <BookmarkPlus size={20} className="action-icon" color="#1a73e8" />
              Lưu
            </button>
          </div>

          {location.details && (location.details.short_description || location.details.description) && (
            <div className="location-description">
              <h3>Thông tin</h3>
              <p>{location.details.description || location.details.short_description || ''}</p>
            </div>
          )}

          <div className="location-details">
            <div className="detail-item">
              <MapPin className="detail-icon" />
              <div className="detail-content">
                <div className="detail-primary">{location.details.basic_info?.address  || location.address || ''}</div>
              </div>
            </div>
          </div>

          {hasImages && (
            <div className="photos-section">
              <div className="photos-header">Ảnh</div>
              <div className="photos-grid">
                {location.images.map((image, index) => (
                  <img
                    key={image.id}
                    src={`${BASE_URL}/media${image.url}`}
                    alt={image.caption || `Photo ${index + 1}`}
                    className="photo-thumbnail"
                    onClick={() => setActiveImageIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};