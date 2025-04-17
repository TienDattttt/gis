
import { Button } from "@/components/ui/button";
import { X, User, BookMarked, Clock, Share2, Heart, Settings } from 'lucide-react';
import './SidePanel.css';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidePanel = ({ isOpen, onClose }: SidePanelProps) => {
  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`}>
      <div className="side-panel-header">
        <Button variant="ghost" className="close-button" onClick={onClose}>
          <X size={20} />
        </Button>
        <div className="google-logo">
          <svg viewBox="0 0 75 24" width="75" height="24" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path d="M14.11 10.316v3.936h5.848c-.222 1.556-.998 2.823-2.107 3.603-1.33.978-3.158 1.556-5.29 1.556-4.21 0-7.59-3.047-8.809-7.205-.222-.667-.333-1.422-.333-2.178 0-.756.111-1.51.333-2.178 1.22-4.158 4.598-7.205 8.809-7.205 2.329 0 4.432.8 5.985 2.356l2.995-2.889C19.874 1.067 17.101 0 14.106 0 11.11 0 8.337 1.067 6.342 3.112c-2.329 2.267-3.66 5.313-3.66 8.716 0 3.403 1.331 6.45 3.66 8.716 1.996 2.045 4.77 3.112 7.764 3.112s5.768-1.067 7.764-3.112c2.218-2.178 3.66-5.58 3.66-9.293 0-.49 0-.934-.11-1.511H14.11v.576z" fill="#4285F4"></path>
              <path d="M25.545 13.082c0 6.005 4.6 10.34 10.318 10.34 2.885 0 5.193-1.11 6.923-2.997l-2.885-2.776c-.865.934-2.308 1.556-4.038 1.556-3.173 0-5.482-2.134-6.347-4.535l-.222-.578h9.742c.222-1.067.332-2.045.332-3.047 0-5.824-4.272-10.938-9.964-10.938-5.693 0-9.964 5.114-9.964 10.938v2.045l5.105-.008zm-4.927-.044c0-.222 0-.356.11-.578 0-.222.111-.445.111-.667l-.221.756v.49zm11.026-6.982c2.773 0 5.028 1.645 5.911 3.914h-11.9c.883-2.269 3.214-3.914 5.989-3.914z" fill="#DB4437"></path>
              <path d="M42.307 23.511h4.382V.577h-4.382v22.934z" fill="#4285F4"></path>
              <path d="M59.734 9.466c-3.907 0-7.036 2.956-7.036 7.026 0 4.07 3.13 7.026 7.036 7.026 3.907 0 7.036-2.956 7.036-7.026 0-4.07-3.13-7.026-7.036-7.026zm0 11.273c-2.108 0-3.907-1.778-3.907-4.248 0-2.47 1.799-4.247 3.907-4.247 2.107 0 3.907 1.778 3.907 4.247 0 2.47-1.8 4.248-3.907 4.248z" fill="#F4B400"></path>
              <path d="M71.294 9.466c-3.907 0-7.037 2.956-7.037 7.026 0 4.07 3.13 7.026 7.037 7.026 3.907 0 7.036-2.956 7.036-7.026 0-4.07-3.129-7.026-7.036-7.026zm0 11.273c-2.108 0-3.907-1.778-3.907-4.248 0-2.47 1.799-4.247 3.907-4.247 2.108 0 3.907 1.778 3.907 4.247 0 2.47-1.799 4.248-3.907 4.248z" fill="#0F9D58"></path>
            </g>
          </svg>
          <span className="maps-text">Maps</span>
        </div>
      </div>

      <div className="side-panel-content">
        <div className="menu-section">
          <div className="menu-item">
            <User size={20} />
            <span>Your profile</span>
          </div>
          <div className="menu-item">
            <BookMarked size={20} />
            <span>Saved</span>
          </div>
          <div className="menu-item">
            <Clock size={20} />
            <span>Recents</span>
          </div>
          <div className="menu-item">
            <Share2 size={20} />
            <span>Share</span>
          </div>
          <div className="menu-item">
            <Heart size={20} />
            <span>Contribute</span>
          </div>
        </div>
        
        <div className="menu-divider"></div>
        
        <div className="menu-section">
          <div className="menu-item">
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};
