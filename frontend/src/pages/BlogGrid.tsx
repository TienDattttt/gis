import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Tag, ChevronRight, ChevronLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from 'axios';

const BlogGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `http://localhost:8000/api/locations/?page=${currentPage}&search=${searchQuery}&tag=${selectedTag}`
        );
        const { results, count } = response.data;

        const postsData = results.map(location => {
          const details = typeof location.details === 'string' 
            ? JSON.parse(location.details) 
            : location.details;

          return {
            id: location.id,
            title: details.title || 'Không có tiêu đề',
            short_des: details.short_description || 'Không có mô tả.',
            address: details.basic_info?.address || 'Giờ mở cửa không có sẵn',
            author: 'Quản trị viên',
            image: location.images.length > 0 ? location.images[0].url : '/images/default-placeholder.jpg',
            opening_hours: details.basic_info?.opening_hours || 'Giờ mở cửa không có sẵn',
          };
        });

        setPosts(postsData);
        setTotalPages(Math.ceil(count / 6));
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu bài viết:', error);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, searchQuery, selectedTag]);

  if (loading) {
    return <div className="text-center py-16">Đang tải...</div>;
  }

  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>;
  }

  if (posts.length === 0) {
    return <div className="text-center py-16">Không tìm thấy bài viết nào.</div>;
  }

  return (
    <div className="pt-24 pb-16">
      {/* Tiêu đề trang */}
      <section className="bg-tourigo-gray-100 py-12">
        <div className="tourigo-container">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Blog Du Lịch</h1>
            <div className="flex items-center text-sm gap-2">
              <Link to="/" className="hover:text-tourigo-primary">Trang chủ</Link>
              <span>/</span>
              <span>Blog</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="tourigo-container">
          {/* Thanh tìm kiếm */}
          <div className="mb-8">
           
            <div className="relative max-w-md mx-auto">
              <Input 
                type="text" 
                placeholder="Tìm kiếm bài viết..." 
                className="pr-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Danh sách bài viết */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <div 
                key={post.id} 
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link to={`/blog-details/${post.id}`} className="block">
                  <img 
                    src={`${BASE_URL}/media${post.image}`}  
                    alt={post.title}
                    className="w-full h-[220px] object-cover"
                  />
                </Link>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3 flex-wrap gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {post.opening_hours}
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      {post.address}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    <Link 
                      to={`/blog-details/${post.id}`} 
                      className="hover:text-tourigo-primary transition-colors duration-300"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-2">{post.short_des}</p>
                  <Link 
                    to={`/blog-details/${post.id}`} 
                    className="text-tourigo-primary font-medium inline-flex items-center hover:text-tourigo-dark transition-colors duration-300"
                  >
                    Xem thêm
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Phân trang */}
          <div className="flex justify-center mt-12">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {[...Array(totalPages)].map((_, i) => (
                <Button 
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  className={currentPage === i + 1 ? "bg-tourigo-primary hover:bg-tourigo-primary/90" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogGrid;