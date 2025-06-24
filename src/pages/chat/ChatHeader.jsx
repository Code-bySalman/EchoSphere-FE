{/*import React, { useState, useEffect } from 'react';
import { IoSettingsOutline } from "react-icons/io5";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../store";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const ChatHeader = () => {
  const navigate = useNavigate();
  const { userInfo, toggleTheme, theme } = useAppStore();

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting('Good Morning');
      } else if (hour >= 12 && hour < 18) {
        setGreeting('Good Afternoon');
      } else if (hour >= 18 && hour < 22) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }
    };

    updateGreeting();
    const intervalId = setInterval(updateGreeting, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const username = userInfo?.name || (userInfo?.email ? userInfo.email.split('@')[0] : 'User');

  return (
    <header className={`w-full p-4 flex items-center justify-between shadow-md z-20 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white'}`}>
      <div className="flex items-center gap-4">
        {userInfo?.image ? (
          <Avatar className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/50">
            <AvatarImage src={userInfo.image} alt="profile" className="object-cover" />
          </Avatar>
        ) : (
          <div
            className="h-10 w-10 uppercase text-lg flex items-center justify-center rounded-full text-white font-bold"
            style={{ backgroundColor: userInfo?.color || '#9B59B6' }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className="text-2xl font-bold">
          {greeting}, {username}!
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <MdLightMode className="text-3xl" />
          ) : (
            <MdDarkMode className="text-3xl" />
          )}
        </button>
        <IoSettingsOutline
          className="text-3xl cursor-pointer hover:text-blue-300 transition-colors duration-200"
          onClick={() => navigate("/profile")}
          title="Edit Profile"
        />
      </div>
    </header>
  );
};

export default ChatHeader;*/}