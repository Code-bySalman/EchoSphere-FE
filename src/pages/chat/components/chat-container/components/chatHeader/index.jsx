import { useAppStore } from '@/store';
import React from 'react';
import { RiCloseFill } from "react-icons/ri";
import { FaVideo } from "react-icons/fa";
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { HOST } from '@/utils/constants';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';

const XchatHeader = () => {
  const { closeChat, selectedChatData, userInfo } = useAppStore();
  const { socket, callState, setCallState } = useSocket();

  if (!selectedChatData) {
    return null;
  }
  
  const displayName = selectedChatData.name || selectedChatData.email;

  const handleCallAction = () => {
    if (callState && callState.type === 'active') {
      if (callState.remoteUserId && userInfo.id) {
        socket.emit('end-call', {
          to: callState.remoteUserId,
          from: userInfo.id,
        });
        setCallState(null);
        toast.info("Call ended.");
      }
    } 
    else {
      if (!selectedChatData?._id) {
          toast.error("Please select a user to call.");
          return;
      }
      if (selectedChatData._id === userInfo.id) {
            toast.error("You cannot call yourself.");
            return;
      }
      if (callState) { 
          toast.info("A call is already in progress or pending acceptance.");
          return;
      }
      
      setCallState({ type: 'outgoing', remoteUserId: selectedChatData._id, callType: 'video' });
      
      socket.emit('outgoing-call', {
          to: selectedChatData._id,
          from: userInfo.id,
          callType: 'video',
      });
      toast.info(`Calling ${displayName}...`);
    }
  };

  const isStartCallDisabled = !!callState && callState.type !== 'active';

  const buttonClassName = `text-2xl ${
    callState && callState.type === 'active' 
      ? 'text-red-500 hover:text-red-400' 
      : (isStartCallDisabled ? 'text-gray-500 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400') 
  }`;


  return (
    <div className='h-[10vh] border-b-2 
                    bg-gradient-to-br from-gray-900 to-black 
                    dark:from-gray-900 dark:to-black // Added dark mode for consistency
                    flex items-center justify-between 
                    px-4 sm:px-6 md:px-8 lg:px-12'>
      <div className='flex gap-5 items-center w-full justify-between'>
       
        <div className='flex gap-3 items-center'> 
          <div className="flex-shrink-0 w-12 h-12">
            <Avatar className="w-full h-full rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
              {selectedChatData.image ? (
                <AvatarImage
                  src={`${HOST}/${selectedChatData.image}`}
                  alt="profile"
                  className="object-cover w-full h-full bg-black"
                />
              ) : (
                <div className={`h-full w-full uppercase text-xl flex items-center justify-center rounded-full text-white font-bold`}
                  style={{ backgroundColor: selectedChatData.color }}
                >
                  {displayName ? displayName.charAt(0).toUpperCase() : ''}
                </div>
              )}
            </Avatar>
          </div>
          
          <div className='flex flex-col'>
            <span className='text-white text-lg font-semibold'>
              {displayName}
            </span>
          </div>
        </div>
      
        <div className='flex items-center gap-4 sm:gap-5'>
          {selectedChatData && selectedChatData.id !== userInfo.id && ( 
            <button
              onClick={handleCallAction} 
              className='text-neutral-500 hover:text-white duration-300 transition-all'
              disabled={isStartCallDisabled} 
            >
              <FaVideo className={buttonClassName} />
            </button>
          )}
          <button 
            className='text-neutral-500 hover:border-none hover:text-white duration-300 transition-all'
            onClick={closeChat} 
          >
            
            <RiCloseFill className='text-3xl' /> 
          </button>
        </div>
      </div>
    </div>
  );
};

export default XchatHeader;