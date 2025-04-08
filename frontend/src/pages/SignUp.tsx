
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
              <h1 className="text-3xl font-bold mb-2">Create an Account</h1>
              <p className="text-gray-500">Join our community of travelers</p>
            </div>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
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
                    placeholder="Create a password"
                    className="pl-10"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long with 1 uppercase, 1 lowercase and 1 number
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <Link to="#" className="text-tourigo-primary hover:text-tourigo-dark">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="#" className="text-tourigo-primary hover:text-tourigo-dark">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              
              <Button type="submit" className="w-full bg-tourigo-primary hover:bg-tourigo-dark">
                Sign Up
              </Button>
            </form>
            
            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full">
                <Facebook className="h-5 w-5 mr-2 text-[#1877F2]" />
                Facebook
              </Button>
              <Button variant="outline" className="w-full">
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </Button>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/sign-in" className="text-tourigo-primary hover:text-tourigo-dark font-medium">
                  Sign In
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
