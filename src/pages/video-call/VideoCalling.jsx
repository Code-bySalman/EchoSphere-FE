import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../../store';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'sonner';

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoCallComponent = () => {
  const { userInfo, selectedChatData } = useAppStore();
  const { socket, callState, setCallState } = useSocket();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [callAcceptedLocally, setCallAcceptedLocally] = useState(false);

  const endCall = useCallback(
    (silent = false) => {
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

      if (
        !silent &&
        callState?.remoteUserId &&
        callState?.type === 'active'
      ) {
        socket.emit('end-call', {
          to: callState.remoteUserId,
          from: userInfo.id,
        });
      }

      setCallState(null);
      setIsConnecting(false);
      setCallAcceptedLocally(false);
    },
    [socket, userInfo?.id, callState, setCallState]
  );

  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = stream;
      localStreamRef.current = stream;
      return stream;
    } catch {
      toast.error('Cannot access camera/mic. Check permissions.');
      return null;
    }
  }, []);

  const createPeerConnection = useCallback(
    stream => {
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = e => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };

      pc.onicecandidate = e => {
        if (e.candidate && callState?.remoteUserId)
          socket.emit('webrtc-ice-candidate', {
            to: callState.remoteUserId,
            from: userInfo.id,
            candidate: e.candidate,
          });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setCallAcceptedLocally(true);
          setIsConnecting(false);
          setCallState(p => (p ? { ...p, type: 'active' } : null));
        } else if (
          ['disconnected', 'failed', 'closed'].includes(pc.connectionState)
        ) {
          endCall(true);
        }
      };

      return pc;
    },
    [socket, userInfo?.id, callState?.remoteUserId, setCallState, endCall]
  );

  const sendOffer = useCallback(
    async pc => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', {
          to: callState.remoteUserId,
          from: userInfo.id,
          offer,
        });
      } catch {
        toast.error('Failed to create offer.');
        endCall(true);
      }
    },
    [socket, userInfo?.id, callState?.remoteUserId, endCall]
  );

  const sendAnswer = useCallback(
    async pc => {
      try {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', {
          to: callState.remoteUserId,
          from: userInfo.id,
          answer,
        });
      } catch {
        toast.error('Failed to create answer.');
        endCall(true);
      }
    },
    [socket, userInfo?.id, callState?.remoteUserId, endCall]
  );

  useEffect(() => {
    if (!socket || !userInfo?.id || !callState) {
      if (!callState) endCall(true);
      return;
    }

    const initCall = async () => {
      setIsConnecting(true);
      const stream = await getMedia();
      if (!stream) {
        endCall(true);
        return;
      }
      const pc = createPeerConnection(stream);
      if (callState.type === 'outgoing-accepted') await sendOffer(pc);
    };

    if (
      ['incoming-accepted', 'outgoing-accepted'].includes(callState.type)
    ) {
      initCall();
    } else if (callState.type === 'incoming') {
      setIsConnecting(false);
    } else if (callState.type === 'outgoing') {
      setIsConnecting(true);
    } else if (callState.type === 'active') {
      setIsConnecting(false);
      setCallAcceptedLocally(true);
    }
  }, [
    socket,
    userInfo,
    callState,
    getMedia,
    createPeerConnection,
    sendOffer,
    endCall,
  ]);

  useEffect(() => {
    if (!socket || !callState?.remoteUserId) return;

    const handleOffer = async ({ from, offer }) => {
      if (from !== callState.remoteUserId) return;
      if (!peerConnectionRef.current) {
        const stream = await getMedia();
        if (!stream) return;
        createPeerConnection(stream);
      }
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      await sendAnswer(peerConnectionRef.current);
    };

    const handleAnswer = async ({ from, answer }) => {
      if (from !== callState.remoteUserId) return;
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    const handleIce = async ({ from, candidate }) => {
      if (from !== callState.remoteUserId) return;
      if (peerConnectionRef.current && candidate)
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIce);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIce);
    };
  }, [socket, callState, getMedia, createPeerConnection, sendAnswer]);

  if (!callState) return null;

  const remoteName = selectedChatData?.name || callState.remoteUserId;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full max-w-4xl max-h-screen bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 p-2 md:p-4">
          <div className="relative w-full h-1/2 md:w-1/2 md:h-full bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              You
            </span>
          </div>

          <div className="relative w-full h-1/2 md:w-1/2 md:h-full bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {remoteName}
            </span>

            {!callAcceptedLocally && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 text-white text-lg font-semibold">
                {callState.type === 'outgoing'
                  ? `Calling ${remoteName}...`
                  : callState.type === 'incoming'
                  ? `Incoming Call from ${remoteName}...`
                  : 'Connecting...'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 p-4 flex justify-center gap-4 border-t border-gray-700">
          {callState.type === 'incoming' && (
            <>
              <button
                onClick={() =>
                  setCallState(p => (p ? { ...p, type: 'incoming-accepted' } : null))
                }
                className="px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  socket.emit('call-rejected', {
                    to: callState.remoteUserId,
                    from: userInfo.id,
                  });
                  setCallState(null);
                }}
                className="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}

          {(callState.type === 'outgoing' || callAcceptedLocally) && (
            <button
              onClick={() => endCall()}
              className="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              End Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallComponent;
