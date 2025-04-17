import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Star, MapPin, Calendar, Clock, Users, ChevronRight, Search, ArrowRight, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Slider from 'react-slick';
import axios from 'axios';

const SurveyForm = ({ onSubmit }) => {
  const [days, setDays] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!days) {
      alert('Vui lòng chọn số ngày lưu trú');
      return;
    }

    // Giả lập tọa độ hiện tại tại Khách sạn Mường Thanh
    const latitude = 16.054054614098437;
    const longitude = 108.24713719515304;

    try {
      const response = await axios.post('http://localhost:8000/api/itinerary/suggest/', {
        days: parseInt(days),
        latitude,
        longitude,
      });
      // Truyền cả itineraryData và currentLocation
      onSubmit({
        itinerary: response.data,
        currentLocation: { lat: latitude, lng: longitude, name: 'Khách sạn Mường Thanh' },
      });
    } catch (error) {
      console.error('Lỗi khi gửi khảo sát:', error);
      alert('Có lỗi xảy ra khi tạo lịch trình. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="absolute bottom-10 left-0 right-0 z-20 px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl mx-auto p-6 border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center md:text-left">
          Lên kế hoạch cho chuyến đi của bạn
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            {/* Số ngày */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-tourigo-primary" />
                <label className="text-gray-700 font-medium text-sm">
                  Số ngày lưu trú
                </label>
              </div>
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tourigo-primary/50 focus:border-tourigo-primary bg-white text-gray-700 appearance-none transition-all duration-200 hover:border-tourigo-primary/70"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                >
                  <option value="" disabled hidden>
                    Chọn số ngày
                  </option>
                  <option value="1">1 Ngày</option>
                  <option value="2">2 Ngày</option>
                  <option value="3">3 Ngày</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Nút Search */}
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full bg-tourigo-primary hover:bg-tourigo-primary/90 text-white py-2.5 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Search className="h-5 w-5 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Nút điều hướng tùy chỉnh
const CustomPrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <button
      className={`${className} absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-tourigo-primary text-white p-2 rounded-full shadow-md hover:bg-tourigo-primary/90 transition-all duration-300`}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );
};

const CustomNextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <button
      className={`${className} absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-tourigo-primary text-white p-2 rounded-full shadow-md hover:bg-tourigo-primary/90 transition-all duration-300`}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    >
      <ChevronRightIcon className="h-6 w-6" />
    </button>
  );
};

const Home = () => {
  const [destination, setDestination] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [guests, setGuests] = useState('1 Person');
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL = 'http://localhost:8000';
  const navigate = useNavigate();
  
  const handleSurveySubmit = (data) => {
    navigate('/tour-details', { state: { itinerary: data.itinerary, currentLocation: data.currentLocation } });
  };
  
  // Lấy tất cả địa điểm từ API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        setError(null);
        // Gọi API mà không dùng phân trang để lấy toàn bộ dữ liệu
        const response = await axios.get(`${BASE_URL}/api/locations/?all=true`);
        const responseData = response.data;
        
        // Kiểm tra và xử lý dữ liệu phản hồi
        let results = [];
        
        if (Array.isArray(responseData)) {
          // Nếu response.data đã là một mảng
          results = responseData;
        } else if (responseData && typeof responseData === 'object') {
          // Nếu là đối tượng, thử tìm mảng trong các thuộc tính phổ biến
          results = responseData.results || 
                   responseData.data || 
                   responseData.items || 
                   responseData.locations || [];
          
          // Nếu vẫn không phải mảng, thử chuyển đổi đối tượng thành mảng
          if (!Array.isArray(results)) {
            console.log('Cấu trúc dữ liệu phản hồi:', responseData);
            results = Object.values(responseData);
          }
        }
        
        // Log để kiểm tra
        console.log('Kết quả sau khi xử lý:', results);
        console.log('Kiểu dữ liệu:', Array.isArray(results) ? 'Array' : typeof results);
        
        if (!Array.isArray(results) || results.length === 0) {
          console.warn('Không tìm thấy kết quả hoặc không thể phân tích phản hồi:', responseData);
          setDestinations([]);
          setLoading(false);
          return;
        }

        const destinationsData = results.map(location => {
          // Đảm bảo location và các thuộc tính của nó tồn tại trước khi truy cập
          if (!location) return null;
          
          const details = typeof location.details === 'string' 
            ? JSON.parse(location.details) 
            : (location.details || {});

          return {
            id: location.id || 0,
            name: (details.title || location.name || 'Không có tiêu đề'),
            location: (details.basic_info?.address || 'Địa điểm không xác định'),
            image: (location.images && location.images.length > 0)
              ? `${BASE_URL}/media${location.images[0].url}` 
              : '/images/default-placeholder.jpg',
          };
        }).filter(Boolean); // Loại bỏ các mục null

        setDestinations(destinationsData);
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu địa điểm:', error);
        setError('Không thể tải dữ liệu địa điểm. Vui lòng thử lại sau.');
        setDestinations([]); // Đặt mảng rỗng để tránh lỗi
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Cấu hình cho slider với nút tùy chỉnh
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative h-screen min-h-[600px] flex items-center bg-cover bg-center"
        style={{ backgroundImage: `url('/images/bien.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="tourigo-container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block px-6 py-2 bg-tourigo-primary text-white rounded-full mb-6">
              Hành trình bất ngờ & Trải nghiệm khó quên
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Khám phá Đà Nẵng <br />
              cùng <span className="text-tourigo-secondary">Tibiki</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
              Tuyệt tác biển xanh vẫy gọi, khám phá ẩm thực đỉnh cao, chinh phục những cây cầu kỳ vĩ - Đà Nẵng, điểm đến không thể bỏ lỡ!
            </p>
          </div>
        </div>
        {/* Form khảo sát */}
        <SurveyForm onSubmit={handleSurveySubmit} />
      </section>
      
      {/* Popular Destinations - Slider */}
      <section className="py-16 bg-gray-100">
        <div className="tourigo-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 tracking-tight">
              Những địa danh nổi tiếng
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Khám phá những địa điểm du lịch được yêu thích nhất của Đà Nẵng
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-gray-600">Đang tải địa điểm...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-tourigo-primary text-white rounded-lg"
              >
                Thử lại
              </button>
            </div>
          ) : destinations.length > 0 ? (
            <Slider {...sliderSettings}>
              {destinations.map((destination) => (
                <div key={destination.id} className="px-2">
                  <div className="destination-card group relative rounded-xl overflow-hidden shadow-lg h-[350px] animate-fade-up">
                    <img
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-6 flex flex-col justify-end">
                      <h3 className="text-xl font-bold text-white mb-1">{destination.name}</h3>
                      <div className="flex items-center text-white mb-4">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{destination.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/blog-details/${destination.id}`}
                          className="bg-white/20 hover:bg-tourigo-primary rounded-full p-2 transition-colors duration-300"
                        >
                          <ChevronRight className="h-5 w-5 text-white" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Không có địa điểm nào được tìm thấy.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/blog-grid"
              className="inline-flex items-center px-6 py-3 bg-tourigo-primary text-white font-semibold rounded-full shadow-md hover:bg-tourigo-primary/90 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
            >
              Xem danh sách địa điểm
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Tours */}
      <section className="py-16">
        <div className="tourigo-container">
          <div className="text-center mb-12">
            <h2 className="section-title">Đà Nẵng tới chơi</h2>
          </div>
          
          <div className="mt-8 flex justify-center">
            <iframe
              width="760"
              height="440"
              src="https://www.youtube.com/embed/ITQN--CN1Wk"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Panorama Section */}
      <section className="py-16">
        <div className="tourigo-container">
          <div className="text-center mb-12">
            <h2 className="section-title">Khám Phá Đà Nẵng Qua Góc Nhìn 360°</h2>
            <p className="section-subtitle">Trải nghiệm toàn cảnh tuyệt đẹp của Đà Nẵng với ảnh panorama</p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <iframe
                width="100%"
                height="400"
                src="https://schools.360cities.net/image/embed/JeCvu4plYLFFYHJdWZVUmQ"
                frameBorder="0"
                allow="accelerometer; gyroscope"
                allowFullScreen
                className="rounded-xl shadow-lg"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;