import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap, Marker, Popup, Circle, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { SearchBar } from '../SearchBar/SearchBar';
import { SidePanel } from '../SidePanel/SidePanel';
import { LocationDetail } from '../LocationDetail/LocationDetail';
import { Landmark, BookOpen, Tent, Mountain, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet-routing-machine';
import './Map.css';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';

// Sửa lỗi icon mặc định của Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Tạo biểu tượng tùy chỉnh và mặc định
const customIcon = new L.Icon({
  iconUrl: '/images/logo.svg',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});
const defaultIcon = new L.Icon.Default();

// Component để đặt chế độ xem cho vị trí cụ thể
const SetViewToLocation = ({ location }) => {
  const map = useMap();

  useEffect(() => {
    if (location) {
      setTimeout(() => {
        map.setView(location, 15);
      }, 100);
    } else {
      setTimeout(() => {
        map.setView([16.0598, 108.2257], 13);
      }, 100);
    }
  }, [map, location]);

  return null;
};

// Component để tự động điều chỉnh khung nhìn bao quát tất cả marker
const FitBoundsToMarkers = ({ locations, districtGeoJSON }) => {
  const map = useMap();

  useEffect(() => {
    if (districtGeoJSON) {
      // Ưu tiên lấy bounds từ ranh giới quận
      const bounds = L.geoJSON(districtGeoJSON).getBounds();
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
      });
    } else if (locations && locations.length > 0) {
      const validLocations = locations.filter(loc => loc.location && loc.location[0] && loc.location[1]);
      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(
          validLocations.map(loc => [loc.location[0], loc.location[1]])
        );
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
        });
      } else {
        map.setView([16.0598, 108.2257], 13);
      }
    }
  }, [map, locations, districtGeoJSON]);

  return null;
};

// Component tùy chỉnh Popup
const CustomPopup = ({ location, baseUrl }) => {
  const placeholderImage = "https://images.unsplash.com/photo-1545074565-53356c98b3f5?q=80&w=1000";
  const imageUrl = location.images && location.images.length > 0
    ? `${baseUrl}/media${location.images[0].url}`
    : placeholderImage;

  return (
    <div className="custom-popup">
      <img
        src={imageUrl}
        alt={location.name}
        className="popup-image"
      />
      <div className="popup-content">
        <h3 className="popup-title">{location.name}</h3>
        <Link to={`/blog-details/${location.id}`} className="popup-detail-button">
          Chi tiết
        </Link>
      </div>
    </div>
  );
};

// Component để vẽ tuyến đường
const RoutingMachine = ({ start, end }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.eachLayer(layer => {
      if (layer instanceof L.Routing.Control) {
        map.removeControl(layer);
      }
    });

    if (start && end) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1]),
        ],
        routeWhileDragging: true,
        show: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ color: '#1a73e8', weight: 4 }],
          extendToWaypoints: false,
          missingRouteTolerance: 0
        },
      }).addTo(map);

      return () => {
        map.removeControl(routingControl);
      };
    }
  }, [map, start, end]);

  return null;
};

// Ánh xạ loại địa điểm
const TOURISM_TYPE_MAPPING = {
  'Điểm tham quan': 'attraction',
  'Bảo tàng': 'museum',
  'Công viên giải trí': 'theme_park',
  'Điểm ngắm cảnh': 'viewpoint',
};

export const MapComponent = () => {
  const BASE_URL = 'http://localhost:8000';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [directionsMode, setDirectionsMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedRouteLocation, setSelectedRouteLocation] = useState(null);
  const [nearbyRadius, setNearbyRadius] = useState(null);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [isNearbyDropdownOpen, setIsNearbyDropdownOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showPanorama, setShowPanorama] = useState(false);
  const [panoramaUrl, setPanoramaUrl] = useState(null);
  const [districts, setDistricts] = useState([]); // Thêm state cho quận/huyện
  const [selectedDistrict, setSelectedDistrict] = useState(''); // State cho quận được chọn
  const [districtGeoJSON, setDistrictGeoJSON] = useState(null); // State cho ranh giới quận

  const currentLocation = {
    lat: 16.054054614098437,
    lng: 108.24713719515304,
    name: 'Khách sạn Mường Thanh',
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDirections = () => setDirectionsMode(!directionsMode);

  const mapContainerRef = useRef(null);

  // Kiểm tra tải biểu tượng
  useEffect(() => {
    const img = new Image();
    img.src = '/images/logo.svg';
    img.onerror = () => {
      console.error('Không thể tải biểu tượng logo.svg. Kiểm tra đường dẫn trong thư mục public.');
    };
  }, []);

  // Lấy vị trí người dùng
  useEffect(() => {
    setUserPosition([currentLocation.lat, currentLocation.lng]);
  }, []);

  // Lấy danh sách quận/huyện
  useEffect(() => {
    axios.get(`${BASE_URL}/api/districts/`)
      .then(response => {
        setDistricts(response.data);
      })
      .catch(error => {
        console.error('Lỗi khi lấy danh sách quận/huyện:', error);
      });
  }, []);

  const filters = [
    { name: 'Điểm tham quan', icon: <Landmark size={20} /> },
    { name: 'Bảo tàng', icon: <BookOpen size={20} /> },
    { name: 'Công viên giải trí', icon: <Tent size={20} /> },
    { name: 'Điểm ngắm cảnh', icon: <Mountain size={20} /> },
  ];

  // Xử lý khi chọn quận/huyện
  const handleDistrictChange = async (e) => {
    const districtName = e.target.value;
    setSelectedDistrict(districtName);
    setSelectedFilter(null);
    setFilteredLocations([]);
    setNearbyLocations([]);
    setNearbyRadius(null);
    setSelectedLocation(null);
    setShowLocationDetail(false);
    setSelectedRouteLocation(null);
    setDistrictGeoJSON(null); // Xóa ranh giới quận cũ ngay lập tức
  
    if (districtName) {
      try {
        setIsLoading(true);
        // Lấy ranh giới quận
        console.log(`Đang tải dữ liệu cho quận: ${districtName}`);
        const districtResponse = await axios.get(`${BASE_URL}/api/districts/${districtName}/`);
        
        // Kiểm tra dữ liệu phản hồi
        if (!districtResponse.data.geom) {
          console.error(`Không tìm thấy dữ liệu geom cho quận ${districtName}`);
          setDistrictGeoJSON(null);
          alert(`Không thể tải ranh giới cho quận ${districtName}.`);
          return;
        }
  
        const newGeoJSON = {
          type: 'Feature',
          properties: { name: districtResponse.data.name },
          geometry: JSON.parse(districtResponse.data.geom),
        };
  
        console.log('GeoJSON mới:', newGeoJSON);
        setDistrictGeoJSON(newGeoJSON);
  
        // Lấy địa điểm trong quận
        const locationsResponse = await axios.get(`${BASE_URL}/api/locations/`, {
          params: { district: districtName },
        });
  
        console.log(`Yêu cầu API: ${BASE_URL}/api/locations/?district=${districtName}`);
        console.log('Phản hồi API địa điểm:', locationsResponse.data);
  
        // Xử lý dữ liệu phân trang hoặc mảng trực tiếp
        let locationsData = locationsResponse.data;
        if (locationsData.results) {
          locationsData = locationsData.results; // Sử dụng results nếu dữ liệu phân trang
        }
  
        // Kiểm tra xem dữ liệu có phải là mảng không
        if (!Array.isArray(locationsData)) {
          console.error('Dữ liệu địa điểm không phải mảng:', locationsData);
          setFilteredLocations([]);
          alert('Lỗi: Dữ liệu từ server không đúng định dạng.');
          return;
        }
  
        // Kiểm tra mảng rỗng
        if (locationsData.length === 0) {
          console.warn(`Không tìm thấy địa điểm nào cho quận ${districtName}`);
          setFilteredLocations([]);
          alert(`Không có địa điểm nào trong quận ${districtName}.`);
          return;
        }
  
        // Xử lý dữ liệu địa điểm
        const locations = locationsData.map((loc) => ({
          id: loc.id,
          name: loc.name_vi || loc.name,
          address: loc.details?.address || '',
          type: loc.tourism_type,
          location: loc.geom ? [loc.geom.lat, loc.geom.lng] : null,
          images: loc.images || [],
          details: loc.details || {},
          embed_url: loc.embed_url || null,
        }));
  
        console.log('Danh sách địa điểm:', locations);
        setFilteredLocations(locations);
        setShowLocationDetail(true);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu quận/huyện hoặc địa điểm:', error);
        setDistrictGeoJSON(null);
        setFilteredLocations([]);
        alert('Có lỗi xảy ra khi lấy dữ liệu. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setDistrictGeoJSON(null);
      setFilteredLocations([]);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
  };

  const handleSelectSuggestion = (suggestion) => {
    axios.get(`${BASE_URL}/api/locations/${suggestion.id}/`)
      .then(response => {
        const locationData = response.data;
        setSelectedLocation({
          id: locationData.id,
          name: locationData.name_vi || locationData.name,
          address: locationData.details?.address || '',
          type: locationData.tourism_type,
          location: locationData.geom ? [locationData.geom.lat, locationData.geom.lng] : null,
          images: locationData.images || [],
          details: locationData.details || {},
          embed_url: locationData.embed_url || null,
        });
        setShowLocationDetail(true);
        setFilteredLocations([]);
        setNearbyLocations([]);
        setNearbyRadius(null);
        setSelectedRouteLocation(null);
        setSelectedDistrict(''); // Xóa quận được chọn khi tìm kiếm
        setDistrictGeoJSON(null); // Xóa ranh giới quận
      })
      .catch(error => {
        console.error('Lỗi khi lấy thông tin địa điểm:', error);
      });
  };

  const handleFilterSelect = async (filterName) => {
    if (selectedFilter === filterName) {
      setSelectedFilter(null);
      setFilteredLocations([]);
      setShowLocationDetail(false);
      setSelectedRouteLocation(null);
      setSelectedDistrict(''); // Xóa quận được chọn
      setDistrictGeoJSON(null); // Xóa ranh giới quận
    } else {
      setSelectedFilter(filterName);
      setSelectedLocation(null);
      setNearbyLocations([]);
      setNearbyRadius(null);
      setSelectedDistrict(''); // Xóa quận được chọn
      setDistrictGeoJSON(null); // Xóa ranh giới quận

      const tourismType = TOURISM_TYPE_MAPPING[filterName];
      if (!tourismType) return;

      try {
        setIsLoading(true);
        const response = await axios.get(`${BASE_URL}/api/locations/all/`, {
          params: {
            tourism_type: tourismType,
            nearby: true,
            lat: currentLocation.lat,
            lng: currentLocation.lng,
          },
        });

        if (!Array.isArray(response.data)) {
          console.error('Dữ liệu trả về không phải là mảng:', response.data);
          setFilteredLocations([]);
          setShowLocationDetail(false);
          alert(`Không tìm thấy địa điểm nào cho loại hình "${filterName}"`);
          return;
        }

        const locations = response.data.map(loc => ({
          id: loc.id,
          name: loc.name_vi || loc.name,
          address: loc.details?.address || '',
          type: loc.tourism_type,
          location: loc.geom ? [loc.geom.lat, loc.geom.lng] : null,
          images: loc.images || [],
          details: loc.details || {},
          distance: loc.distance || calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            loc.geom?.lat,
            loc.geom?.lng
          ),
          embed_url: loc.embed_url || null,
        }));

        locations.sort((a, b) => a.distance - b.distance);

        setFilteredLocations(locations);
        setShowLocationDetail(true);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách địa điểm:', error);
        setFilteredLocations([]);
        setShowLocationDetail(false);
        alert('Có lỗi xảy ra khi lấy danh sách địa điểm. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNearbySelect = async (radiusKm) => {
    setNearbyRadius(radiusKm);
    setIsNearbyDropdownOpen(false);
    setSelectedFilter(null);
    setFilteredLocations([]);
    setSelectedLocation(null);
    setSelectedRouteLocation(null);
    setShowLocationDetail(false);
    setSelectedDistrict(''); // Xóa quận được chọn
    setDistrictGeoJSON(null); // Xóa ranh giới quận

    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/locations/all/`, {
        params: {
          nearby: true,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          radius: radiusKm,
        },
      });

      if (!Array.isArray(response.data)) {
        console.error('Dữ liệu trả về không phải là mảng:', response.data);
        setNearbyLocations([]);
        alert('Không tìm thấy địa điểm nào trong bán kính đã chọn.');
        return;
      }

      const locations = response.data.map(loc => ({
        id: loc.id,
        name: loc.name_vi || loc.name,
        address: loc.details?.address || '',
        type: loc.tourism_type,
        location: loc.geom ? [loc.geom.lat, loc.geom.lng] : null,
        images: loc.images || [],
        details: loc.details || {},
        distance: loc.distance || calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          loc.geom?.lat,
          loc.geom?.lng
        ),
        embed_url: loc.embed_url || null,
      }));

      locations.sort((a, b) => a.distance - b.distance);

      setNearbyLocations(locations);
      setShowLocationDetail(true);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách địa điểm lân cận:', error);
      setNearbyLocations([]);
      alert('Có lỗi xảy ra khi lấy danh sách địa điểm. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSelectedLocation(null);
    setFilteredLocations([]);
    setNearbyLocations([]);
    setNearbyRadius(null);
    setShowLocationDetail(false);
    setSelectedFilter(null);
    setSelectedRouteLocation(null);
    setShowPanorama(false);
    setPanoramaUrl(null);
    setSelectedDistrict(''); // Xóa quận được chọn
    setDistrictGeoJSON(null); // Xóa ranh giới quận
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat2 || !lon2) return Infinity;
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleClearRoute = () => {
    setSelectedRouteLocation(null);
  };

  const handleClosePanorama = () => {
    setShowPanorama(false);
    setPanoramaUrl(null);
  };

  return (
    <div className="map-page">
      <div className="search-container">
        <div className="search-and-filter">
          <div className="search-bar-wrapper">
            <SearchBar
              onMenuClick={toggleSidebar}
              onDirectionsClick={toggleDirections}
              directionsMode={directionsMode}
              searchText={searchText}
              onSearchChange={handleSearch}
              onClearSearch={clearSearch}
              onSelectResult={handleSelectSuggestion}
              isLoading={isLoading}
            />
          </div>
          <div className="district-select-wrapper">
            <select value={selectedDistrict} onChange={handleDistrictChange} className="district-select">
              <option value="">Chọn quận/huyện</option>
              {districts.map(district => (
                <option key={district.id} value={district.name}>{district.name}</option>
              ))}
            </select>
          </div>
          <div className="nearby-button-wrapper">
            <div
              className="relative"
              onMouseEnter={() => setIsNearbyDropdownOpen(true)}
              onMouseLeave={() => setIsNearbyDropdownOpen(false)}
            >
              <button className="nearby-button">
                <span className="filter-icon"><MapPin size={20} /></span>
                <span className="filter-name">Gần tôi</span>
              </button>
              {isNearbyDropdownOpen && (
                <div className="nearby-dropdown">
                  <button
                    className="nearby-dropdown-item"
                    onClick={() => handleNearbySelect(5)}
                  >
                    5km
                  </button>
                  <button
                    className="nearby-dropdown-item"
                    onClick={() => handleNearbySelect(10)}
                  >
                    10km
                  </button>
                  <button
                    className="nearby-dropdown-item"
                    onClick={() => handleNearbySelect(15)}
                  >
                    15km
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="filter-buttons">
            {filters.map((filter) => (
              <button
                key={filter.name}
                className={`filter-button ${selectedFilter === filter.name ? 'active' : ''}`}
                onClick={() => handleFilterSelect(filter.name)}
              >
                <span className="filter-icon">{filter.icon}</span>
                <span className="filter-name">{filter.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="map-container" ref={mapContainerRef}>
        <MapContainer
          center={userPosition || [16.0598, 108.2257]}
          zoom={13}
          zoomControl={false}
          className="map"
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapReady && <ZoomControl position="bottomright" />}

          <SetViewToLocation
            location={selectedLocation ? selectedLocation.location : (userPosition || [currentLocation.lat, currentLocation.lng])}
          />

          <FitBoundsToMarkers locations={nearbyLocations.length > 0 ? nearbyLocations : filteredLocations} districtGeoJSON={districtGeoJSON} />

          {districtGeoJSON && (
            <GeoJSON
              data={districtGeoJSON}
              style={() => ({
                color: '#ff7800',
                weight: 2,
                fillOpacity: 0.2,
              })}
            />
          )}

          {nearbyRadius && (
            <Circle
              center={[currentLocation.lat, currentLocation.lng]}
              radius={nearbyRadius * 1000}
              pathOptions={{ color: '#FF0000', fillColor: '#FF0000', fillOpacity: 0.2 }}
            />
          )}

          {selectedRouteLocation && selectedRouteLocation.location && (
            <RoutingMachine
              start={[currentLocation.lat, currentLocation.lng]}
              end={selectedRouteLocation.location}
            />
          )}

          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>
              <strong>{currentLocation.name}</strong>
            </Popup>
          </Marker>

          {filteredLocations.map((loc) => (
            loc.location && (
              <Marker
                key={loc.id}
                position={loc.location}
                icon={loc.embed_url && loc.embed_url.trim() !== '' ? customIcon : defaultIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedLocation(loc);
                    setShowLocationDetail(true);
                    if (loc.embed_url && loc.embed_url.trim() !== '') {
                      setShowPanorama(true);
                      setPanoramaUrl(loc.embed_url);
                    } else {
                      setShowPanorama(false);
                      setPanoramaUrl(null);
                    }
                  },
                }}
              >
                <Popup>
                  <CustomPopup location={loc} baseUrl={BASE_URL} />
                </Popup>
              </Marker>
            )
          ))}

          {nearbyLocations.map((loc) => (
            loc.location && (
              <Marker
                key={loc.id}
                position={loc.location}
                icon={loc.embed_url && loc.embed_url.trim() !== '' ? customIcon : defaultIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedLocation(loc);
                    setShowLocationDetail(true);
                    if (loc.embed_url && loc.embed_url.trim() !== '') {
                      setShowPanorama(true);
                      setPanoramaUrl(loc.embed_url);
                    } else {
                      setShowPanorama(false);
                      setPanoramaUrl(null);
                    }
                  },
                }}
              >
                <Popup>
                  <CustomPopup location={loc} baseUrl={BASE_URL} />
                </Popup>
              </Marker>
            )
          ))}

          {selectedLocation && selectedLocation.location && !nearbyLocations.length && !filteredLocations.length && (
            <Marker
              position={selectedLocation.location}
              icon={selectedLocation.embed_url && selectedLocation.embed_url.trim() !== '' ? customIcon : defaultIcon}
              eventHandlers={{
                click: () => {
                  if (selectedLocation.embed_url && selectedLocation.embed_url.trim() !== '') {
                    setShowPanorama(true);
                    setPanoramaUrl(selectedLocation.embed_url);
                  } else {
                    setShowPanorama(false);
                    setPanoramaUrl(null);
                  }
                },
              }}
            >
              <Popup>
                <CustomPopup location={selectedLocation} baseUrl={BASE_URL} />
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {selectedRouteLocation && (
          <button className="clear-route-button" onClick={handleClearRoute}>
            Xóa tuyến đường
          </button>
        )}

        <SidePanel isOpen={sidebarOpen} onClose={toggleSidebar} />

        {showLocationDetail && (
          <LocationDetail
            location={selectedLocation}
            locationsList={nearbyLocations.length > 0 ? nearbyLocations : filteredLocations}
            onClose={() => {
              setShowLocationDetail(false);
              setFilteredLocations([]);
              setNearbyLocations([]);
              setNearbyRadius(null);
              setSelectedFilter(null);
              setSelectedRouteLocation(null);
              setSelectedLocation(null);
              setShowPanorama(false);
              setPanoramaUrl(null);
              setSelectedDistrict(''); // Xóa quận được chọn
              setDistrictGeoJSON(null); // Xóa ranh giới quận
            }}
            setSelectedRouteLocation={setSelectedRouteLocation}
          />
        )}

        {showPanorama && panoramaUrl && (
          <div className="panorama-container">
            <button className="panorama-close-button" onClick={handleClosePanorama}>
              ✕
            </button>
            <iframe
              src={panoramaUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title="360 Panorama"
            />
          </div>
        )}
      </div>
    </div>
  );
};