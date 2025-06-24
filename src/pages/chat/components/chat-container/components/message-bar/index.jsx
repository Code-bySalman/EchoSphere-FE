import { GrAttachment } from "react-icons/gr";
import { useRef, useState, useEffect } from "react";
import { RiEmojiStickerLine } from "react-icons/ri";
import { IoSend } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";
import { useAppStore } from "@/store";
import { useSocket } from "@/context/SocketContext";
import moment from "moment";
import { apiClient } from "@/lib/api-client";
import { UPLOAD_FILE } from "@/utils/constants";

const MessageBar = () => {
    const [message, setMessage] = useState("");
    const emojiRef = useRef();
    const fileInputRef = useRef();
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const { socket } = useSocket();
    const { selectedChatType, selectedChatData, userInfo, addMessage } = useAppStore();

    const toggleEmojiPicker = () => {
        setEmojiPickerOpen((prev) => !prev);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setEmojiPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [emojiRef]);

    const handleSendMessage = async () => {
        if (!socket) {
            console.error("[MessageBar] Socket is not connected or available yet.");
            return;
        }

        if (message.trim() === "") {
            console.warn("[MessageBar] Message is empty. Not sending.");
            return;
        }

        if (selectedChatType === "user") {
            if (!selectedChatData?._id) {
                console.error("[MessageBar] Recipient ID is missing. Cannot send message.");
                return;
            }
            if (!userInfo?.id) {
                console.error("[MessageBar] Sender ID is missing. Cannot send message.");
                return;
            }

            try {
                const tempMessageId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const currentTimestamp = moment().toISOString();

                const optimisticMessage = {
                    _id: tempMessageId,
                    sender: {
                        _id: userInfo.id,
                        name: userInfo.name || 'Unknown User',
                        email: userInfo.email || ''
                    },
                    recipient: {
                        _id: selectedChatData._id,
                        name: selectedChatData.name || 'Unknown Recipient',
                        email: selectedChatData.email || ''
                    },
                    contents: message,
                    messageType: "text",
                    timestamp: currentTimestamp,
                    status: "sending"
                };

                addMessage(optimisticMessage);
                console.log("[MessageBar DEBUG] Optimistically added user message to store with _id:", optimisticMessage._id);

                const messageToSendToServer = {
                    sender: userInfo.id.toString(),
                    recipient: selectedChatData._id.toString(),
                    contents: message,
                    messageType: "text",
                    timestamp: currentTimestamp,
                    tempClientMessageId: tempMessageId,
                };

                socket.emit("sendMessage", messageToSendToServer);
                console.log("[MessageBar DEBUG] Emitted user message to server. Sent tempClientMessageId:", messageToSendToServer.tempClientMessageId);

                setMessage("");
                setEmojiPickerOpen(false);

            } catch (error) {
                console.error("[MessageBar] Error during user message send process:", error);
            }

        } else if (selectedChatType === "channel") {
            if (!selectedChatData?._id) {
                console.error("[MessageBar] Channel ID is missing. Cannot send message.");
                return;
            }
            if (!userInfo?.id) {
                console.error("[MessageBar] Sender ID is missing. Cannot send message.");
                return;
            }

            try {
                const tempMessageId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const currentTimestamp = moment().toISOString();

                const optimisticMessage = {
                    _id: tempMessageId,
                    sender: {
                        _id: userInfo.id,
                        name: userInfo.name || 'Unknown User',
                        email: userInfo.email || ''
                    },
                    channelId: selectedChatData._id,
                    contents: message,
                    messageType: "text",
                    timestamp: currentTimestamp,
                    status: "sending"
                };

                addMessage(optimisticMessage);
                console.log("[MessageBar DEBUG] Optimistically added channel message to store with _id:", optimisticMessage._id);

                const messageToSendToServer = {
                    sender: userInfo.id.toString(),
                    contents: message,
                    messageType: "text",
                    fileUrl: undefined,
                    channelId: selectedChatData._id.toString(),
                    timestamp: currentTimestamp,
                    tempClientMessageId: tempMessageId,
                };

                socket.emit("send-channel-message", messageToSendToServer);
                console.log("[MessageBar DEBUG] Emitted channel message to server. Sent tempClientMessageId:", messageToSendToServer.tempClientMessageId);

                setMessage("");
                setEmojiPickerOpen(false);

            } catch (error) {
                console.error("[MessageBar] Error during channel message send process:", error);
            }
        } else {
            console.warn(`[MessageBar] Cannot send message: Unsupported chat type "${selectedChatType}".`);
        }
    };

    const handleAttachment = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAttachmentChange = async (event) => {
        try {
            const file = event.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                const response = await apiClient.post(UPLOAD_FILE, formData, { withCredentials: true });

                if (response.status === 200 && response.data?.filePath) {
                    const fileUrl = response.data.filePath;

                    const tempMessageId = `optimistic-file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    const currentTimestamp = moment().toISOString();

                    if (selectedChatType === "user") {
                        const optimisticMessage = {
                            _id: tempMessageId,
                            sender: {
                                _id: userInfo.id,
                                name: userInfo.name || 'Unknown User',
                                email: userInfo.email || ''
                            },
                            recipient: {
                                _id: selectedChatData._id,
                                name: selectedChatData.name || 'Unknown Recipient',
                                email: selectedChatData.email || ''
                            },
                            contents: undefined,
                            messageType: "file",
                            fileUrl: fileUrl,
                            timestamp: currentTimestamp,
                            status: "sending"
                        };
                        addMessage(optimisticMessage);

                        socket.emit("sendMessage", {
                            sender: userInfo.id.toString(),
                            contents: undefined,
                            recipient: selectedChatData._id.toString(),
                            messageType: "file",
                            fileUrl: fileUrl,
                            timestamp: currentTimestamp,
                            tempClientMessageId: tempMessageId,
                        });
                        console.log("[MessageBar DEBUG] Emitted user file to server. Sent tempClientMessageId:", tempMessageId);

                    } else if (selectedChatType === "channel") {
                        if (!selectedChatData?._id) {
                            console.error("[MessageBar] Channel ID is missing for file. Cannot send message.");
                            return;
                        }

                        const optimisticMessage = {
                            _id: tempMessageId,
                            sender: {
                                _id: userInfo.id,
                                name: userInfo.name || 'Unknown User',
                                email: userInfo.email || ''
                            },
                            channelId: selectedChatData._id,
                            contents: undefined,
                            messageType: "file",
                            fileUrl: fileUrl,
                            timestamp: currentTimestamp,
                            status: "sending"
                        };
                        addMessage(optimisticMessage);

                        socket.emit("send-channel-message", {
                            sender: userInfo.id.toString(),
                            contents: undefined,
                            messageType: "file",
                            fileUrl: fileUrl,
                            channelId: selectedChatData._id.toString(),
                            timestamp: currentTimestamp,
                            tempClientMessageId: tempMessageId,
                        });
                        console.log("[MessageBar DEBUG] Emitted channel file to server. Sent tempClientMessageId:", tempMessageId);

                    } else {
                        console.warn(`[MessageBar] Cannot send file: Unsupported chat type "${selectedChatType}".`);
                    }
                }
            }
        } catch (error) {
            console.error("Error handling attachment:", error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        }
    };

    const handleEmojiPicker = (emoji) => {
        setMessage((msg) => msg + emoji.emoji);
    };

   return (
    <div className="h-[8vh] w-[72vw] bg-black flex items-center justify-center ml-12 mt-3 mb-6 gap-6">
      <div className="flex-1 flex bg-white rounded-xl text-black items-center gap-5 w-[50%]">
        <input
          type="text"
          placeholder="Enter your text here..."
          value={message}
          className="flex-1 p-3 bg-transparent rounded-md focus:border-none focus:outline-none text-black text-md"
          onChange={(e) => setMessage(e.target.value)}
          onClick={() => setEmojiPickerOpen(false)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
        />
        <button
          className="text-neutral-500 hover:text-black duration-300 text-xl transition-all"
          onClick={toggleEmojiPicker}
        >
          <RiEmojiStickerLine />
        </button>
        <div className="absolute bottom-16 right-4 mb-10 rounded-md" ref={emojiRef}>
          {emojiPickerOpen && (
            <EmojiPicker
              theme="dark"
              open={emojiPickerOpen}
              onEmojiClick={handleEmojiPicker}
              autoFocusSearch={false}
            />
          )}
        </div>
        <div className="relative">
          <button
            className="text-neutral-500 hover:text-black duration-300 text-xl transition-all pr-3"
            onClick={handleAttachment}
          >
            <GrAttachment />
          </button>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleAttachmentChange}
          />
        </div>
      </div>

      <button
        className="bg-gradient-to-r from-purple-700 to-blue-600 rounded-md flex items-center justify-center p-3 focus:border-none hover:bg-gray-500 duration-300 text-xl transition-all"
        onClick={handleSendMessage}
      >
        <IoSend className="text-2xls" />
      </button>
    </div>
  );
};

export default MessageBar;