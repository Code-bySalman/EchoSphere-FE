import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "../../store";
import { useNavigate } from "react-router-dom";

import ContactContainer from "./components/contact-container";
import EmptyChatContainer from "./components/emptry-chat-container";
import ChatContainer from "./components/chat-container";

const Chat = () => {
  const { userInfo, theme, selectedChatType, selectedChatData } = useAppStore();
  const navigate = useNavigate();

  const [showContactList, setShowContactList] = useState(true);

  useEffect(() => {
    if (userInfo === null) {
      navigate("/auth");
    } else if (userInfo.profileSetup === false) {
      toast("Please set up your profile first.");
      navigate("/profile");
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowContactList(true);
      } else {
        setShowContactList(!selectedChatType);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChatType]);

  return (
    <div className="h-screen w-screen flex relative overflow-hidden
                    bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">

      <div className="flex w-full h-full">
        <div
          className={`
            relative z-20 transition-all duration-300 ease-in-out
            w-full md:w-[35vw] lg:w-[30vw] xl:w-[20vw]
            ${showContactList ? 'block' : 'hidden md:block'}
          `}
        >
          <ContactContainer />
        </div>

        <div className={`
            flex-1 flex flex-col transition-all duration-300 ease-in-out
            ${showContactList ? 'hidden md:flex' : 'flex'}
          `}>
     

         {selectedChatType===undefined?(
            <EmptyChatContainer />
         ) : (<ChatContainer/>
            
         ) }
        
        </div>
      </div>
    </div>
  );
};

export default Chat;