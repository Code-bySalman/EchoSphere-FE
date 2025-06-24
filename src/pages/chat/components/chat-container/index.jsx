import React from 'react';
import XchatHeader from './components/chatHeader';
import MessageContainer from './components/mesage-container';
import MessageBar from './components/message-bar';

const ChatContainer = () => {
  return (
    <div className="fixed top-0 h-[100vh] w-[100vw]  bg-gradient-to-br from-gray-900 to-black flex flex-col md:static md:flex-1">
  <XchatHeader/>
    <MessageContainer/>
    <MessageBar/>
    
    </div>
  );
};

export default ChatContainer;