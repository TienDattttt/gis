import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const BASE_URL = 'http://localhost:8000';

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/signin/`, {
        username,
        password,
      });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
      toast.error(err.response?.data?.error || 'Đăng nhập thất bại.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="tourigo-container">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl overflow-hidden shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Chào mừng trở lại!</h1>
              <p className="text-gray-500">Đăng nhập ngay</p>
            </div>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên người dùng
                </label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập tên người dùng"
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mật khẩu
                  </label>
                  <Link to="#" className="text-sm text-tourigo-primary hover:text-tourigo-dark">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-tourigo-primary hover:bg-tourigo-dark">
                Đăng nhập
              </Button>
            </form>
            <div className="text-center mt-8">
              <p className="text-gray-600">
                Bạn chưa có tài khoản?{' '}
                <Link to="/sign-up" className="text-tourigo-primary hover:text-tourigo-dark font-medium">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;