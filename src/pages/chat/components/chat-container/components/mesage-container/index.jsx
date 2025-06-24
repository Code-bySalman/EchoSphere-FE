import { apiClient } from '@/lib/api-client';
import { useAppStore } from '@/store';
import {
  GET_ALL_MESSAGES,
  GET_CHANNEL_MESSAGES_ROUTE,
  HOST,
} from '@/utils/constants';
import moment from 'moment';
import { useRef, useEffect, useState } from 'react';
import { FaFile, FaDownload } from 'react-icons/fa';
import { IoCloseCircleOutline } from 'react-icons/io5';

const MessageContainer = () => {
  const scrollRef = useRef(null);
  const {
    selectedChatType,
    selectedChatData,
    userInfo,
    selectedChatMessages,
    setSelectedChatMessages,
  } = useAppStore();
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState('');
  const [modalMediaType, setModalMediaType] = useState('');

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatMessages]);

  useEffect(() => {
    const getMessages = async () => {
      try {
        if (!selectedChatData?._id || !userInfo?.token) {
          setSelectedChatMessages([]);
          return;
        }

        setSelectedChatMessages([]);

        let response;
        if (selectedChatType === 'user') {
          response = await apiClient.post(
            GET_ALL_MESSAGES,
            { id: selectedChatData._id },
            { withCredentials: true }
          );
        } else if (selectedChatType === 'channel') {
          response = await apiClient.get(
            GET_CHANNEL_MESSAGES_ROUTE(selectedChatData._id),
            { withCredentials: true }
          );
        }

        if (response?.data?.messages) {
          setSelectedChatMessages(response.data.messages);
        } else setSelectedChatMessages([]);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setSelectedChatMessages([]);
      }
    };

    getMessages();
  }, [selectedChatData?._id, selectedChatType, userInfo?.token, setSelectedChatMessages]);

  const openMediaModal = (url, type) => {
    setModalMediaUrl(url);
    setModalMediaType(type);
    setShowMediaModal(true);
  };

  const closeMediaModal = () => {
    setModalMediaUrl('');
    setModalMediaType('');
    setShowMediaModal(false);
  };

  const downloadMedia = async () => {
    try {
      if (!modalMediaUrl) return;
      const relativeUrl = modalMediaUrl.replace(HOST, '');
      if (relativeUrl === modalMediaUrl) return;
      const response = await apiClient.get(`${HOST}${relativeUrl}`, {
        responseType: 'blob',
      });
      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', relativeUrl.split('/').pop() || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error('Error during media download:', error);
    }
  };

  const renderMessage = () => {
    let currentDate = null;
    return selectedChatMessages.map((message, index) => {
      const messageDate = message.timestamp ? moment(message.timestamp).format('YYYY-MM-DD') : null;
      const showDate = messageDate && messageDate !== currentDate;
      currentDate = messageDate;
      const key = message._id || `temp-${index}`;

      return (
        <div key={key}>
          {showDate && (
            <div className="text-center text-gray-500 my-2 text-sm">
              {moment(message.timestamp).format('LL')}
            </div>
          )}
          {selectedChatType === 'user' && renderDm(message)}
          {selectedChatType === 'channel' && renderChannelDM(message)}
        </div>
      );
    });
  };

  const renderDm = (message) => {
    const isMyMessage =
      userInfo && message.sender && message.sender._id === userInfo.id;
    const messageClass = isMyMessage
      ? 'bg-blue-500 text-white text-lg self-end'
      : 'bg-gray-500 text-lg text-white self-start';
    const borderRadiusClass = isMyMessage ? 'rounded-br-none' : 'rounded-bl-none';
    const fullUrl = message.fileUrl ? `${HOST}${message.fileUrl}` : '';
    const isImage = fullUrl && /\.(jpeg|jpg|png|gif|webp)$/i.test(fullUrl);
    const isVideo = fullUrl && /\.(mp4|webm|ogg)$/i.test(fullUrl);

    return (
      <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} my-1`}>
        <div className={`${messageClass} inline-block p-2 rounded-xl max-w-[70%] break-words ${borderRadiusClass}`}>
          {message.messageType === 'text' && <div>{message.contents}</div>}
          {message.messageType === 'file' && message.fileUrl && (
            <div>
              {isImage ? (
                <img
                  src={fullUrl}
                  alt="media"
                  className="max-w-full h-auto rounded-md object-cover cursor-pointer"
                  onClick={() => openMediaModal(fullUrl, 'image')}
                  style={{ maxHeight: '300px' }}
                />
              ) : isVideo ? (
                <video
                  src={fullUrl}
                  controls
                  className="max-w-full h-auto rounded-md object-cover cursor-pointer"
                  onClick={() => openMediaModal(fullUrl, 'video')}
                  style={{ maxHeight: '300px' }}
                />
              ) : (
                <a
                  href={fullUrl}
                  download={message.fileUrl.split('/').pop()}
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-300 hover:underline cursor-pointer p-2 rounded-md bg-white/10"
                >
                  <FaFile className="text-xl" />
                  <span className="truncate text-sm">{message.fileUrl.split('/').pop()}</span>
                  <FaDownload className="text-sm ml-auto" />
                </a>
              )}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-600 self-end ml-2 mr-2">
          {moment(message.timestamp).format('LT')}
        </div>
      </div>
    );
  };

const renderChannelDM = (message) => {
  if (!message.sender) return null;

  const isMyMessage = message.sender._id === userInfo.id;
  const fullUrl = message.fileUrl ? `${HOST}${message.fileUrl}` : '';
  const isImage = fullUrl && /\.(jpeg|jpg|png|gif|webp)$/i.test(fullUrl);
  const isVideo = fullUrl && /\.(mp4|webm|ogg)$/i.test(fullUrl);

  const bubble = `border inline-block p-3 rounded-xl max-w-[70%] break-words ${
    isMyMessage
      ? 'bg-[#2a2b33]/5 text-white/80 border-[#ffffff]/20'
      : 'bg-[#8417ff]/5 text-[#8417ff]/90 border-[#8417ff]/50'
  }`;

  // First letter in uppercase
  const firstLetter =
    message.sender.name && message.sender.name.length
      ? message.sender.name.charAt(0).toUpperCase()
      : '?';

  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} my-1`}>
      <div>
        {!isMyMessage && (
          <div className="flex items-center gap-2 mb-1 ml-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold uppercase"
              style={{ backgroundColor: message.sender.color || '#555' }}
            >
              {firstLetter}
            </div>
            <span className="text-sm text-gray-400">
              {message.sender.name || 'Unknown User'}
            </span>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className={bubble}>
            {message.messageType === 'text' && <div>{message.contents}</div>}

            {message.messageType === 'file' && message.fileUrl && (
              <div>
                {isImage ? (
                  <img
                    src={fullUrl}
                    alt="media"
                    className="max-w-full h-auto rounded-md object-cover cursor-pointer"
                    onClick={() => openMediaModal(fullUrl, 'image')}
                    style={{ maxHeight: '300px' }}
                  />
                ) : isVideo ? (
                  <video
                    src={fullUrl}
                    controls
                    className="max-w-full h-auto rounded-md object-cover cursor-pointer"
                    onClick={() => openMediaModal(fullUrl, 'video')}
                    style={{ maxHeight: '300px' }}
                  />
                ) : (
                  <a
                    href={fullUrl}
                    download={message.fileUrl.split('/').pop()}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-300 hover:underline cursor-pointer p-2 rounded-md bg-white/10"
                  >
                    <FaFile className="text-xl" />
                    <span className="truncate text-sm">
                      {message.fileUrl.split('/').pop()}
                    </span>
                    <FaDownload className="text-sm ml-auto" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-600">
            {moment(message.timestamp).format('LT')}
          </div>
        </div>
      </div>
    </div>
  );
};


  return (
    <div className="flex-1 overflow-y-auto p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full bg-gradient-to-br from-[#1d263a] to-[#252f40] border-l border-white/5 shadow-inner-lg text-white flex flex-col">
      {renderMessage()}
      <div ref={scrollRef} />
      {showMediaModal && modalMediaUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={closeMediaModal}
        >
          <div
            className="relative max-w-screen-lg max-h-screen-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {modalMediaType === 'image' && (
              <img
                src={modalMediaUrl}
                alt="media"
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            {modalMediaType === 'video' && (
              <video
                src={modalMediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
            <button
              onClick={closeMediaModal}
              className="absolute top-4 right-4 text-white text-4xl cursor-pointer hover:text-gray-300 z-10"
            >
              <IoCloseCircleOutline />
            </button>
            <button
              onClick={downloadMedia}
              className="absolute top-4 right-16 text-white text-2xl cursor-pointer hover:text-gray-300 z-10"
            >
              <FaDownload />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageContainer;
