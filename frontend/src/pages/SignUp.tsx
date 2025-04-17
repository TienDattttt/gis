
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Facebook, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const SignUp = () => {
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="tourigo-container">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl overflow-hidden shadow-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Tạo tài khoản</h1>
             
            </div>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Họ Tên
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nhập họ tên"
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email 
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập Email"
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    className="pl-10"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                
              </div>
              
           
              
              <Button type="submit" className="w-full bg-tourigo-primary hover:bg-tourigo-dark">
                Đăng ký
              </Button>
            </form>
            
          
            
         
            <div className="text-center mt-8">
              <p className="text-gray-600">
                Đã có tài khoản?{' '}
                <Link to="/sign-in" className="text-tourigo-primary hover:text-tourigo-dark font-medium">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
