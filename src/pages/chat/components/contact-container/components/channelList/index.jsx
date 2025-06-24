import React from 'react';
import { useAppStore } from '@/store';
import { ScrollArea } from "@/components/ui/scroll-area";

const ChannelList = () => {
    const { channel, setSelectedChatType, setSelectedChatData, setSelectedChatMessages } = useAppStore();

    const handleChannelClick = (selectedChannel) => {
        console.log("[ChannelList] Channel clicked:", selectedChannel);

        setSelectedChatType("channel");
        setSelectedChatData({
            _id: selectedChannel._id,
            name: selectedChannel.name,
        });
        setSelectedChatMessages([]);
    };

    if (!channel || channel.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400">
                No channels found. Create or join one!
            </div>
        );
    }

    return (
        <ScrollArea className="h-full w-full">
            <div className="p-4">
                {channel.map((singleChannel) => (
                    <div
                        key={singleChannel._id}
                        className="mb-3 p-3 rounded-lg bg-gray-800/60 hover:bg-gray-700/60
                                   border border-gray-700/50 transition-colors duration-200
                                   flex items-center gap-3 cursor-pointer"
                        onClick={() => handleChannelClick(singleChannel)}
                    >
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold bg-blue-600/70">
                            #
                        </div>
                        <span className="text-white text-base">{singleChannel.name}</span>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};

export default ChannelList;