import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../../store'; // Adjust path if necessary
import { useSocket } from '../../context/SocketContext'; // Adjust path if necessary
import { toast } from 'sonner'; // Assuming you have sonner for toasts

// IMPORTANT: STUN servers help peers find each other. Google's are free and public.
// For production and complex network setups (e.g., corporate firewalls), you might need a TURN server.
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // You can add more STUN servers here.
        // If you set up a TURN server, add it here too:
        // { urls: 'turn:YOUR_TURN_SERVER_IP:PORT', username: 'YOUR_TURN_USERNAME', credential: 'YOUR_TURN_PASSWORD' }
    ],
};

const VideoCallComponent = () => {
    const { userInfo, selectedChatData } = useAppStore(); // Get userInfo and selectedChatData from Zustand
    const { socket, callState, setCallState } = useSocket(); // Get socket and callState from your SocketContext

    const localVideoRef = useRef(); // Ref for the local video element
    const remoteVideoRef = useRef(); // Ref for the remote video element
    const peerConnectionRef = useRef(null); // Ref for the RTCPeerConnection object
    const localStreamRef = useRef(null); // Ref for the local media stream

    // Internal component state to manage UI during call connection/acceptance
    const [isConnecting, setIsConnecting] = useState(false);
    const [callAcceptedLocally, setCallAcceptedLocally] = useState(false); // True when WebRTC connection is established

    // Function to get local media (camera and microphone)
    const getMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideoRef.current.srcObject = stream;
            localStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            toast.error('Failed to access camera/microphone. Please check permissions.');
            return null;
        }
    }, []);

    // Function to create and configure RTCPeerConnection
    const createPeerConnection = useCallback((stream) => {
        const peerConnection = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = peerConnection;

        // Add local media tracks to the peer connection
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });

        // Event: When a remote track arrives (from the other peer)
        peerConnection.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Event: When ICE candidates are found (network information)
        peerConnection.onicecandidate = (event) => {
            // Only emit if there's a remoteUserId in the current callState
            if (event.candidate && callState?.remoteUserId) {
                socket.emit('webrtc-ice-candidate', {
                    to: callState.remoteUserId,
                    from: userInfo.id,
                    candidate: event.candidate,
                });
            }
        };

        // Optional: Monitor the connection state
        peerConnection.onconnectionstatechange = () => {
            if (peerConnection.connectionState === 'connected') {
                setCallAcceptedLocally(true); // WebRTC connection is now established
                setIsConnecting(false); // Stop showing 'Connecting...'
                setCallState(prev => prev ? { ...prev, type: 'active' } : null); // Update context state to 'active'
            } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
                // Call ended or failed due to connection issues
                endCall(true); // End call silently
            }
        };

        return peerConnection;
    }, [socket, userInfo.id, callState?.remoteUserId, setCallState]); // Dependencies

    // Function to send an SDP Offer
    const sendOffer = useCallback(async (peerConnection) => {
        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer); // Set local description before sending
            socket.emit('webrtc-offer', {
                to: callState.remoteUserId,
                from: userInfo.id,
                offer: offer,
            });
        } catch (err) {
            console.error('Error creating or sending offer:', err);
            toast.error('Failed to create call offer.');
            endCall(true); // End call on error
        }
    }, [socket, userInfo.id, callState?.remoteUserId, endCall]);

    // Function to send an SDP Answer
    const sendAnswer = useCallback(async (peerConnection) => {
        try {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer); // Set local description before sending
            socket.emit('webrtc-answer', {
                to: callState.remoteUserId,
                from: userInfo.id,
                answer: answer,
            });
        } catch (err) {
            console.error('Error creating or sending answer:', err);
            toast.error('Failed to create call answer.');
            endCall(true); // End call on error
        }
    }, [socket, userInfo.id, callState?.remoteUserId, endCall]);

    // Function to end an active call
    const endCall = useCallback((silent = false) => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close(); // Close the RTCPeerConnection
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop()); // Stop local media tracks
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        // Only emit 'end-call' if it's an explicit hangup from an active call, not internal cleanup or rejection
        if (!silent && callState?.remoteUserId && callState?.type === 'active') {
            socket.emit('end-call', {
                to: callState.remoteUserId,
                from: userInfo.id,
            });
        }
        // Reset all call-related states
        setCallState(null); // Reset global call state in SocketContext
        setIsConnecting(false);
        setCallAcceptedLocally(false);
    }, [socket, userInfo.id, callState, setCallState]); // Dependencies for endCall

    // Effect to react to changes in callState from SocketContext
    useEffect(() => {
        // Only run if socket, userInfo, and callState are available
        if (!socket || !userInfo?.id || !callState) {
            // If callState becomes null, ensure cleanup
            if (!callState) {
                endCall(true); // Silent cleanup if callState is null
            }
            return;
        }

        const initCallProcess = async () => {
            setIsConnecting(true); // Start connection UI feedback
            const stream = await getMedia(); // Get local camera/mic
            if (!stream) {
                endCall(true); // If media acquisition fails, end call silently
                return;
            }
            const peerConnection = createPeerConnection(stream); // Create RTCPeerConnection

            // If this is the caller and the recipient accepted (outgoing-accepted)
            if (callState.type === 'outgoing-accepted') {
                await sendOffer(peerConnection); // Create and send SDP offer
            }
            // If this is the receiver and accepted (incoming-accepted), the offer will arrive via socket listener
        };

        // Determine action based on callState type
        if (callState.type === 'incoming-accepted' || callState.type === 'outgoing-accepted') {
            initCallProcess(); // Start WebRTC connection process
        } else if (callState.type === 'incoming') {
            // Component is rendered because there's an incoming call, but WebRTC not active yet (waiting for user accept)
            setIsConnecting(false); // Not actively connecting WebRTC, just displaying waiting state
        } else if (callState.type === 'outgoing') {
            // Call initiated, waiting for recipient's acceptance. UI shows "Calling..."
            setIsConnecting(true);
        } else if (callState.type === 'active') {
            // Call is fully established, ensure UI reflects this
            setIsConnecting(false);
            setCallAcceptedLocally(true);
        }

    }, [socket, userInfo, callState, getMedia, createPeerConnection, sendOffer, setCallState, endCall]);

    // Socket listeners specific to WebRTC SDP/ICE exchange (handled directly by this component)
    useEffect(() => {
        // Only attach these listeners if there's an active callState and remoteUserId
        if (!socket || !callState || !callState.remoteUserId) return;

        const handleWebrtcOffer = async ({ from, offer }) => {
            if (from !== callState.remoteUserId) return; // Ignore if not from current peer
            if (!peerConnectionRef.current) {
                // Fallback: If peer connection somehow not initialized, create it and get media
                const stream = await getMedia();
                if (!stream) return;
                createPeerConnection(stream);
            }
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer)); // Set remote offer
            await sendAnswer(peerConnectionRef.current); // Create and send SDP answer
        };

        const handleWebrtcAnswer = async ({ from, answer }) => {
            if (from !== callState.remoteUserId) return; // Ignore if not from current peer
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer)); // Set remote answer
            }
        };

        const handleWebrtcIceCandidate = async ({ from, candidate }) => {
            if (from !== callState.remoteUserId) return; // Ignore if not from current peer
            try {
                if (peerConnectionRef.current && candidate) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)); // Add ICE candidate
                }
            } catch (e) {
                // Common error: 'DOMException: Failed to execute 'addIceCandidate' on 'RTCPeerConnection': The ICE candidate could not be added.'
                // This can happen if the connection state changes before the candidate is added, or if it's a duplicate. Usually safe to ignore for robust apps.
                console.warn('Error adding received ICE candidate (often ignorable):', e);
            }
        };

        // Attach WebRTC signaling listeners
        socket.on('webrtc-offer', handleWebrtcOffer);
        socket.on('webrtc-answer', handleWebrtcAnswer);
        socket.on('webrtc-ice-candidate', handleWebrtcIceCandidate);

        // Cleanup function for these listeners
        return () => {
            socket.off('webrtc-offer', handleWebrtcOffer);
            socket.off('webrtc-answer', handleWebrtcAnswer);
            socket.off('webrtc-ice-candidate', handleWebrtcIceCandidate);
        };
    }, [socket, callState, getMedia, createPeerConnection, sendAnswer]); // Dependencies for this useEffect

    // The component only renders if callState is not null (i.e., a call is incoming, outgoing, or active)
    if (!callState) {
        return null;
    }

    // Determine the display name for the remote user
    const remoteUserDisplayName = selectedChatData?.name || callState.remoteUserId;

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4`}>
            <div className="relative w-full h-full max-w-4xl max-h-screen bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden">
                <div className="flex-1 relative flex flex-col md:flex-row items-center justify-center gap-4 p-2 md:p-4">
                    {/* Local Video Stream */}
                    <div className="relative w-full h-1/2 md:w-1/2 md:h-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted // Mute local video to prevent echo
                            className="w-full h-full object-cover rounded-lg"
                        />
                        <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            You
                        </span>
                    </div>

                    {/* Remote Video Stream */}
                    <div className="relative w-full h-1/2 md:w-1/2 md:h-full bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover rounded-lg"
                        />
                        <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {remoteUserDisplayName}
                        </span>
                        {/* Overlay text if call is not yet established locally */}
                        {!callAcceptedLocally && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 text-white text-lg font-semibold">
                                {callState.type === 'outgoing' ? `Calling ${remoteUserDisplayName}...` :
                                 (callState.type === 'incoming' ? `Incoming Call from ${remoteUserDisplayName}...` :
                                  'Connecting...')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Call Controls */}
                <div className="bg-gray-900 p-3 sm:p-4 flex justify-center items-center gap-4 border-t border-gray-700">
                    {/* Accept/Reject buttons for incoming calls */}
                    {callState.type === 'incoming' && (
                        <>
                            <button
                                onClick={() => setCallState(prev => prev ? { ...prev, type: 'incoming-accepted' } : null)}
                                className="px-5 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => {
                                    // Emit call-rejected and clear callState
                                    socket.emit('call-rejected', { to: callState.remoteUserId, from: userInfo.id });
                                    setCallState(null);
                                }}
                                className="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                Reject
                            </button>
                        </>
                    )}
                    {/* End Call button for ongoing or outgoing calls */}
                    {(callState.type === 'outgoing' || callAcceptedLocally) && (
                        <button
                            onClick={() => endCall()}
                            className="px-5 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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