import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { FaPlus } from "react-icons/fa";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Avatar,AvatarImage } from "@/components/ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client";
import { SEARCH_CONTACT_ROUTE } from "@/utils/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store";
import { profileColors } from "@/lib/utils";

const HOST = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const NewDm = () => {
    const { setSelectedChatType, setSelectedChatData  } = useAppStore();
    const [openNewContactModel, setOpenNewContactModel] = useState(false);
    const [searchedUsers, setSearchedUsers] = useState([]);
    const [currentSearchTerm, setCurrentSearchTerm] = useState("");

    const searchUsers = async (searchTerm) => {
        setCurrentSearchTerm(searchTerm);
        try {
            if (searchTerm.length > 0) {
                const response = await apiClient.post(SEARCH_CONTACT_ROUTE, { searchTerm }, {
                    withCredentials: true
                });
                if (response.status === 200 && response.data.contacts) {
                    setSearchedUsers(response.data.contacts);
                } else {
                    setSearchedUsers([]);
                }
            } else {
                setSearchedUsers([]);
            }
        } catch (error) {
            console.error("Error searching users:", error);
            setSearchedUsers([]);
        }
    };
  const selectNewUser = (user)=>{
      setOpenNewContactModel(false);
      setSelectedChatType("user");
      setSelectedChatData(user);
      setSearchedUsers([]);
  }

  return (
    <>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <FaPlus className="text-neutral-400 font-light text-opacity-90 text-sm hover:text-neutral-100 cursor-pointer duration-300 transition-all" onClick={() => setOpenNewContactModel(true)}/>
        </TooltipTrigger>
        <TooltipContent className="bg-[#1c1b1e] border-none mb-2 p-3 text-white shadow-lg rounded-md">
          Start New Chat
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <Dialog open={openNewContactModel} onOpenChange={setOpenNewContactModel}>
      <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[480px] flex flex-col p-6 rounded-xl shadow-2xl">
        <DialogHeader className="mb-4 flex-shrink-0"> {/* Add flex-shrink-0 */}
          <DialogTitle className="text-2xl font-bold text-center mb-2 text-blue-300">Start a New Chat</DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-sm">
            Search for your friend's name or meail and start messaging
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex-shrink-0"> 
          <Input
            placeholder="Search username or email..."
            className="rounded-full p-3 bg-[#2c2e3b] border border-[#3a3c4a] text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            onChange={e => searchUsers(e.target.value)}
          />
        </div>

        
        {searchedUsers.length > 0 ? (
          <ScrollArea className="flex-1 overflow-y-auto"> 
            <p className="text-gray-400 text-sm mb-3 px-2">
                Results for "<span className="font-semibold text-white">{currentSearchTerm}</span>"
            </p>
            <div className="flex flex-col gap-3">
                {searchedUsers.map(user => (
                    <div
                        key={user._id}
                        className="flex items-center gap-4 p-3 rounded-xl cursor-pointer
                                   bg-[#20222a] hover:bg-[#2c2e3b] active:scale-[0.98]
                                   transition-all duration-200 ease-in-out transform shadow-sm hover:shadow-md"
                        
                        onClick={() => selectNewUser(user)}
                    >
                        <div className="flex-shrink-0 w-12 h-12">
                            <Avatar className="w-full h-full rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
                                {user.image ? (
                                    <AvatarImage
                                        src={`${HOST}/${user.image}`}
                                        alt="profile"
                                        className="object-cover w-full h-full bg-black"
                                    />
                                ) : (
                                    <div
                                        className={`h-full w-full uppercase text-xl flex items-center justify-center rounded-full text-white font-bold`}
                                        style={{ backgroundColor: user.color || profileColors[0] }}
                                    >
                                        {user.name
                                            ? user.name.charAt(0).toUpperCase()
                                            : user.email.charAt(0).toUpperCase()
                                        }
                                    </div>
                                )}
                            </Avatar>
                        </div>
                        <div className="flex flex-col flex-grow min-w-0">
                            <span className="text-lg font-semibold text-white truncate">
                                {user.name || "Unnamed User"}
                            </span>
                            <span className="text-sm text-gray-400 truncate">{user.email}</span>
                        </div>
                    </div>
                ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden p-4">
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center filter-container">
              <div className="absolute liquid-blob blob-one bg-blue-500"></div>
              <div className="absolute liquid-blob blob-two bg-green-400"></div>
              <div className="absolute liquid-blob blob-three bg-purple-400"></div>
            </div>
            <p className="absolute bottom-4 text-gray-400 text-sm mt-4 text-center">
              {currentSearchTerm.length > 0 ? "No users found matching your search." : "Start typing a username or email to find people to chat with!"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <style jsx>{`
      .filter-container {
        filter: url(#goo);
      }

      .liquid-blob {
        border-radius: 50%;
        opacity: 0.8;
        animation-iteration-count: infinite;
        animation-timing-function: ease-in-out;
        mix-blend-mode: screen;
      }

      .blob-one {
        width: 60px;
        height: 60px;
        animation-name: animateBlobOne;
        animation-duration: 10s;
      }
      @keyframes animateBlobOne {
        0% { transform: translate(-30px, -30px) scale(1); }
        25% { transform: translate(30px, -30px) scale(1.1); }
        50% { transform: translate(30px, 30px) scale(0.9); }
        75% { transform: translate(-30px, 30px) scale(1.2); }
        100% { transform: translate(-30px, -30px) scale(1); }
      }

      .blob-two {
        width: 80px;
        height: 80px;
        animation-name: animateBlobTwo;
        animation-duration: 12s;
      }
      @keyframes animateBlobTwo {
        0% { transform: translate(20px, 20px) scale(1); }
        25% { transform: translate(-20px, 20px) scale(0.9); }
        50% { transform: translate(-20px, -20px) scale(1.2); }
        75% { transform: translate(20px, -20px) scale(1.1); }
        100% { transform: translate(20px, 20px) scale(1); }
      }

      .blob-three {
        width: 70px;
        height: 70px;
        animation-name: animateBlobThree;
        animation-duration: 11s;
      }
      @keyframes animateBlobThree {
        0% { transform: translate(-10px, 10px) scale(1.2); }
        25% { transform: translate(10px, 10px) scale(1); }
        50% { transform: translate(10px, -10px) scale(1.1); }
        75% { transform: translate(-10px, -10px) scale(0.9); }
        100% { transform: translate(-10px, 10px) scale(1.2); }
      }
    `}</style>

    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
        </filter>
      </defs>
    </svg>
    </>
  )
}

export default NewDm;