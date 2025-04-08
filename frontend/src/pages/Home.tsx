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
      alert('Có lỗi xảy ra khi tạo lịch trình. Vui lòng thử lại.');
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
        const results = response.data; // Giả định API trả về mảng đầy đủ khi có tham số `all=true`

        const destinationsData = results.map(location => {
          const details = typeof location.details === 'string' 
            ? JSON.parse(location.details) 
            : location.details;

          return {
            id: location.id,
            name: details.title || 'Không có tiêu đề',
            location: details.basic_info?.address || 'Địa điểm không xác định',
            image: location.images.length > 0 
              ? `${BASE_URL}/media${location.images[0].url}` 
              : '/images/default-placeholder.jpg',
          };
        });

        setDestinations(destinationsData);
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu địa điểm:', error);
        setError('Không thể tải dữ liệu địa điểm. Vui lòng thử lại sau.');
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
            <p className="section-subtitle">Discover our most booked and highly-rated tour packages</p>
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
          
          <div className="text-center mt-12">
            <Link to="/tour-details" className="btn-outline inline-flex items-center">
              View All Tours
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us
      <section className="py-16 bg-tourigo-gray-100">
        <div className="tourigo-container">
          <div className="text-center mb-12">
            <h2 className="section-title">Why Choose Us</h2>
            <p className="section-subtitle">Our commitment to making your travel experience exceptional</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-xl shadow-md animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-tourigo-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <feature.icon className="h-8 w-8 text-tourigo-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Testimonials */}
      {/* <section className="py-16">
        <div className="tourigo-container">
          <div className="text-center mb-12">
            <h2 className="section-title">What Our Travelers Say</h2>
            <p className="section-subtitle">Read testimonials from our satisfied customers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-xl shadow-md animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center text-tourigo-secondary mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-cta-pattern bg-cover bg-center">
        <div className="tourigo-container text-center">
          <div className="max-w-3xl mx-auto animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Bạn đã sẵn sàng cho một cuộc phiêu lưu khó quên chưa?
            </h2>
            <Link to="/tour-details" className="btn-secondary inline-flex items-center">
              Khám phá ngay
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16">
        <div className="tourigo-container">
          <div className="text-center mb-12">
            <h2 className="section-title">Latest Travel Stories</h2>
            <p className="section-subtitle">Inspiration and tips for your next adventure</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link to="/blog-details" className="block">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-[220px] object-cover"
                  />
                </Link>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="h-4 w-4 mr-1" />
                    {post.date}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    <Link to="/blog-details" className="hover:text-tourigo-primary transition-colors duration-300">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  <Link 
                    to="/blog-details" 
                    className="text-tourigo-primary font-medium inline-flex items-center hover:text-tourigo-dark transition-colors duration-300"
                  >
                    Read More
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/blog-grid" className="btn-outline inline-flex items-center">
              View All Stories
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Sample Data
const destinations = [
  {
    name: "Bali, Indonesia",
    location: "Indonesia",
    tours: 15,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Santorini, Greece",
    location: "Greece",
    tours: 12,
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d3a6425c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Kyoto, Japan",
    location: "Japan",
    tours: 10,
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Paris, France",
    location: "France",
    tours: 20,
    image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Machu Picchu, Peru",
    location: "Peru",
    tours: 8,
    image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "New York, USA",
    location: "United States",
    tours: 18,
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  }
];

const tours = [
  {
    title: "Bali: Island of the Gods",
    location: "Bali, Indonesia",
    duration: 7,
    price: 1299,
    discount: 15,
    reviews: 48,
    image: "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Greek Island Hopping Adventure",
    location: "Santorini, Greece",
    duration: 10,
    price: 1799,
    discount: 10,
    reviews: 36,
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Cultural Tour of Japan",
    location: "Tokyo, Japan",
    duration: 12,
    price: 2499,
    discount: 5,
    reviews: 52,
    image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Romantic Paris Getaway",
    location: "Paris, France",
    duration: 5,
    price: 1199,
    discount: 20,
    reviews: 41,
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Machu Picchu Explorer",
    location: "Cusco, Peru",
    duration: 8,
    price: 1699,
    discount: 12,
    reviews: 29,
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "New York City Discovery",
    location: "New York, USA",
    duration: 6,
    price: 1499,
    discount: 8,
    reviews: 37,
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  }
];

const features = [
  {
    title: "Handpicked Tours",
    description: "Our team carefully selects the best tours for unforgettable experiences.",
    icon: Search
  },
  {
    title: "Best Price Guarantee",
    description: "Find a lower price? We'll match it and give you an additional 10% off.",
    icon: Star
  },
  {
    title: "Personalized Service",
    description: "Customized itineraries tailored to your preferences and interests.",
    icon: Users
  },
  {
    title: "24/7 Support",
    description: "Our dedicated support team is available round the clock to assist you.",
    icon: Clock
  }
];

const testimonials = [
  {
    name: "Michael Johnson",
    location: "San Francisco, USA",
    text: "My trip to Bali was absolutely amazing! The tour guides were knowledgeable and friendly, and the itinerary was perfectly balanced.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    name: "Sarah Thompson",
    location: "London, UK",
    text: "The Greek Island tour exceeded all my expectations. Every detail was taken care of, and the accommodations were superb.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    name: "David Chen",
    location: "Sydney, Australia",
    text: "Japan was magical! Tourigo made everything so easy, from transportation to accommodations. I'll definitely book with them again.",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg"
  }
];

const blogPosts = [
  {
    title: "10 Essential Tips for First-Time Travelers to Bali",
    excerpt: "Make the most of your Bali adventure with these insider tips that every traveler should know.",
    date: "June 15, 2023",
    image: "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "The Hidden Gems of Santorini That Most Tourists Miss",
    excerpt: "Explore the lesser-known but equally beautiful spots on this famous Greek island.",
    date: "May 22, 2023",
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "A Foodie's Guide to Exploring Japanese Cuisine",
    excerpt: "Discover the diverse and delicious world of Japanese food beyond just sushi and ramen.",
    date: "April 10, 2023",
    image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  }
];

export default Home;
