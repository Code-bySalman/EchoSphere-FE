// client/src/context/SocketContext.js

import {
  useAppStore
} from "@/store";
import {
  HOST
} from "@/utils/constants";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import {
  io
} from "socket.io-client";
import {
  toast
} from "sonner";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({
  children
}) => {
  const socket = useRef(null);
  const [callState, setCallState] = useState(null);

  const {
    userInfo,
    addMessage,
    replaceTemporaryMessage
  } = useAppStore();

  useEffect(() => {
    if (userInfo && userInfo.id) {
      if (socket.current) {
        socket.current.disconnect();
      }

      const newSocket = io(HOST, {
        withCredentials: true,
        query: {
          userId: userInfo.id
        },
      });

      newSocket.on("connect", () => {
        console.log(`[SocketContext] Socket connected with ID: ${newSocket.id}`);
      });

      newSocket.on("disconnect", () => {
        console.log("[SocketContext] Socket disconnected.");
      });

      socket.current = newSocket;
      console.log(`[SocketContext] Attempting to connect socket for user: ${userInfo.id}`);

    } else if (!userInfo?.id && socket.current) {
      console.log("[SocketContext] User info not available, disconnecting socket.");
      socket.current.disconnect();
      socket.current = null;
      setCallState(null);
    }

    return () => {
      if (socket.current) {
        console.log("[SocketContext] Cleanup: Disconnecting socket and clearing ref.");
        socket.current.disconnect();
        socket.current = null;
        setCallState(null);
      }
    };
  }, [userInfo]);

  useEffect(() => {
    if (socket.current) {
      const handleReceiveMessage = (message) => {
        console.log("[SocketContext DEBUG] Raw message received:", message);

        const normalizedMessage = {
          ...message,
          sender: typeof message.sender === "object" && message.sender !== null ?
            message.sender :
            {
              _id: message.sender
            },
          recipient: typeof message.recipient === "object" && message.recipient !== null ?
            message.recipient :
            {
              _id: message.recipient
            },
        };
        console.log("[SocketContext DEBUG] Normalized message:", normalizedMessage);

        const currentSelectedChatData = useAppStore.getState().selectedChatData;
        const currentUserInfo = useAppStore.getState().userInfo;

        const isRelevantToSelectedChat =
          currentSelectedChatData &&
          (
            (normalizedMessage.sender?._id === currentSelectedChatData._id &&
              normalizedMessage.recipient?._id === currentUserInfo.id) ||
            (normalizedMessage.sender?._id === currentUserInfo.id &&
              normalizedMessage.recipient?._id === currentSelectedChatData._id)
          );

        if (isRelevantToSelectedChat) {
          console.log("[SocketContext DEBUG] Message is relevant to selected chat. Calling replaceTemporaryMessage.");
          replaceTemporaryMessage(normalizedMessage);
        } else {
          console.log("[SocketContext DEBUG] Message not relevant to selected chat. Skipping UI update for now.");
        }
      };

      const handleRecieveChannelMessage = (message) => {
        console.log("[SocketContext DEBUG] Raw channel message received:", message);

        const normalizedMessage = {
          ...message,
          sender: typeof message.sender === "object" && message.sender !== null ?
            message.sender :
            {
              _id: message.sender
            },
        };
        console.log("[SocketContext DEBUG] Normalized channel message:", normalizedMessage);

        const {
          selectedChatData,
          selectedChatType,
          userInfo: currentUserInfo
        } = useAppStore.getState();

        const isRelevantToSelectedChannel =
          selectedChatType === "channel" &&
          selectedChatData &&
          selectedChatData._id === normalizedMessage.channelId;

        const isMyOwnChannelMessage = normalizedMessage.sender?._id === currentUserInfo.id;


        if (isRelevantToSelectedChannel) {
          if (isMyOwnChannelMessage) {
            console.log("[SocketContext DEBUG] My own channel message received. Calling replaceTemporaryMessage.");
            replaceTemporaryMessage(normalizedMessage);
          } else {
            console.log("[SocketContext DEBUG] Channel message from another user received. Calling addMessage.");
            addMessage(normalizedMessage);
          }
        } else {
          console.log("[SocketContext DEBUG] Channel message not relevant to selected channel. Skipping UI update for now.");
        }
      };


      const handleIncomingCall = ({
        from,
        callType
      }) => {
        if (callState) {
          socket.current.emit('call-rejected', {
            to: from,
            from: userInfo.id
          });
          toast.warning(`Missed ${callType} call from ${from} - already in a call.`);
          return;
        }

        setCallState({
          type: 'incoming',
          remoteUserId: from,
          callType
        });
        toast(`${from} is calling you for a ${callType} call!`, {
          action: {
            label: 'Accept',
            onClick: () => {
              setCallState({
                type: 'incoming-accepted',
                remoteUserId: from,
                callType
              });
            },
          },
          cancel: {
            label: 'Reject',
            onClick: () => {
              socket.current.emit('call-rejected', {
                to: from,
                from: userInfo.id
              });
              setCallState(null);
            },
          },
          duration: 15000,
        });
      };

      const handleCallAccepted = ({
        from
      }) => {
        toast.success(`${from} accepted your call!`);
        setCallState({
          type: 'outgoing-accepted',
          remoteUserId: from
        });
      };

      const handleCallRejected = ({
        from
      }) => {
        toast.error(`${from} rejected your call.`);
        setCallState(null);
      };

      const handleCallEnded = ({
        from
      }) => {
        toast.info(`${from} ended the call.`);
        setCallState(null);
      };

      const handleUserNotOnline = ({
        to
      }) => {
        toast.error("User is not online or currently unavailable.");
        setCallState(null);
      };

      socket.current.on("recieveMessage", handleReceiveMessage);
      socket.current.on("reciece-channel-message", handleRecieveChannelMessage);
      socket.current.on("incoming-call", handleIncomingCall);
      socket.current.on("call-accepted", handleCallAccepted);
      socket.current.on("call-rejected", handleCallRejected);
      socket.current.on("call-ended", handleCallEnded);
      socket.current.on("user-not-online", handleUserNotOnline);

      return () => {
        if (socket.current) {
          socket.current.off("recieveMessage", handleReceiveMessage);
          socket.current.off("reciece-channel-message", handleRecieveChannelMessage);
          socket.current.off("incoming-call", handleIncomingCall);
          socket.current.off("call-accepted", handleCallAccepted);
          socket.current.off("call-rejected", handleCallRejected);
          socket.current.off("call-ended", handleCallEnded);
          socket.current.off("user-not-online", handleUserNotOnline);
        }
      };
    }
  }, [socket.current, userInfo, addMessage, replaceTemporaryMessage, callState]);

  return ( <
    SocketContext.Provider value = {
      {
        socket: socket.current,
        callState,
        setCallState
      }
    } > {
      children
    } </SocketContext.Provider>
  )
}