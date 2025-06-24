import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { FiEdit2 } from "react-icons/fi";
import { HOST, LOGOUT_ROUTE } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import {IoLogOut} from "react-icons/io5"
import { apiClient } from "@/lib/api-client";

const ProfileInfo = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const navigate = useNavigate();

  if (!userInfo) {
    return null;
  }

  const logOut = async () =>{
    try {
      const response = await apiClient.post(LOGOUT_ROUTE,{},{withCredentials:true});
      if (response.status===200) {
        setUserInfo(null)
        navigate("/auth")
      }
    } catch(error) {
      console.log(error);
    }
  }

  const getCleanedImagePath = (path) => {
    if (!path) return null;
    return path.startsWith('/') ? path.substring(1) : path;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[8vh] flex items-between justify-between
                    px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 py-2
                    bg-gradient-to-r from-[#1e2738] to-[#2a3248]
                    border-t border-white/10 shadow-xl z-30">

      <div className="flex gap-3 items-center">
        <div className="flex-shrink-0 w-10 h-10 relative flex items-center justify-center">
          <Avatar className="h-full w-full rounded-full overflow-hidden border-2 border-blue-400 shadow-md ml-[-70px]">
            {userInfo.image ? (
              <AvatarImage
                src={`${HOST}/${getCleanedImagePath(userInfo.image)}`}
                alt="profile"
                className="object-cover w-full h-full bg-black"
              />
            ) : (
              <div
                className={`h-full w-full uppercase text-base sm:text-lg flex items-center justify-center  rounded-full text-white font-bold` }
                style={{ backgroundColor: userInfo.color || '#9B59B6' }}
              >
                {userInfo.name
                  ? userInfo.name.charAt(0).toUpperCase()
                  : userInfo.email.charAt(0).toUpperCase()
                }
              </div>
            )}
          </Avatar>
        </div>
        <div className="text-white  text-base sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-[200px] ml-[-40px] mr-4">
          {userInfo.name
            ? userInfo.name.charAt(0).toUpperCase() + userInfo.name.slice(1)
            : userInfo.email.split('@')[0].charAt(0).toUpperCase() + userInfo.email.split('@')[0].slice(1)
          }
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded-full 
                               bg-gradient-to-br from-purple-600 to-blue-600
                               text-white hover:text-white
                               hover:from-purple-500 hover:to-blue-500
                               transition-all duration-300
                               focus:outline-none focus:ring-2 focus:ring-blue-400 "
                    onClick={() => navigate("/profile")}>
              <FiEdit2 className="text-sm" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-800 text-white border border-gray-700 text-sm py-1 px-2 rounded-md">
            <p>Edit Profile</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-2 rounded-full 
                               bg-gradient-to-br from-purple-600 to-blue-600
                               text-white hover:text-white
                               hover:from-purple-500 hover:to-blue-500
                               transition-all duration-300
                               focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={logOut}>
              <IoLogOut className="text-sm" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-800 text-white border border-gray-700 text-sm py-1 px-2 rounded-md">
            <p>Logout</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default ProfileInfo;