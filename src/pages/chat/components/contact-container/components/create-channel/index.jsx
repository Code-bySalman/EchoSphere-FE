import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { FaPlus } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client";
import { CREATE_CHANNEL_ROUTE, GET_CONTACTS_FOR_CHANNEL } from "@/utils/constants";
import { useAppStore } from "@/store";
import { profileColors } from "@/lib/utils";
import MultipleSelector from "@/components/ui/multipleselect";

const HOST = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

const CreateChannel = () => {
    const { setSelectedChatType, setSelectedChatData, addChannel } = useAppStore();
    const [newChannelModel, setNewChannelModel] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [channelName, setChannelName] = useState("");

    const multipleSelectorRef = useRef(null);
    const [isMultipleSelectorOpen, setIsMultipleSelectorOpen] = useState(false);


    useEffect(() => {
        const getData = async () => {
            try {
                const response = await apiClient.get(GET_CONTACTS_FOR_CHANNEL, {
                    withCredentials: true,
                });
                setAllContacts(response.data.contacts);
            } catch (error) {
                console.error("Error fetching contacts:", error);
            }
        }
        getData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (multipleSelectorRef.current && !multipleSelectorRef.current.contains(event.target)) {
                setIsMultipleSelectorOpen(false);
            }
        };

        if (newChannelModel) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [newChannelModel]);


    const createChannel = async () => {
        try {
            if (channelName.trim().length === 0) {
                console.error("Channel name cannot be empty.");
                return;
            }
            if (selectedContacts.length === 0) {
                console.error("Please select at least one member for the channel.");
                return;
            }

            const response = await apiClient.post(CREATE_CHANNEL_ROUTE, {
                name: channelName,
                members: selectedContacts.map((contact) => contact.value)
            }, { withCredentials: true })

            if (response.status === 201) {
                setChannelName("");
                setSelectedContacts([]);
                setNewChannelModel(false);
                addChannel(response.data.channel);
            }
        } catch (error) {
            console.error("Error creating channel:", error.response ? error.response.data : error.message);
        }
    };

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <FaPlus className="text-neutral-400 font-light text-opacity-90 text-sm hover:text-neutral-100 cursor-pointer duration-300 transition-all" onClick={() => setNewChannelModel(true)} />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1c1b1e] border-none mb-2 p-3 text-white shadow-lg rounded-md">
                        Create a channel.
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Dialog open={newChannelModel} onOpenChange={setNewChannelModel}>
                <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[480px] flex flex-col p-6 rounded-xl shadow-2xl">
                    <DialogHeader className="mb-4 flex-shrink-0">
                        <DialogTitle className="text-2xl font-bold text-center mb-2 text-blue-300">Start a New Channel</DialogTitle>
                        <DialogDescription className="text-center text-gray-400 text-sm">
                            Search for users by their username or email and start with each other.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mb-4 flex-shrink-0">
                        <Input
                            placeholder="Channel Name"
                            className="rounded-full p-3 bg-[#2c2e3b] border border-[#3a3c4a] text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                            onChange={e => setChannelName(e.target.value)}
                            value={channelName}
                        />
                    </div>

                    <div ref={multipleSelectorRef}>
                        <MultipleSelector
                            className="rounded-lg bg-gray-500 border-none py-2 text-white"
                            defaultOptions={allContacts}
                            placeholder="Select Contacts"
                            value={selectedContacts}
                            onChange={setSelectedContacts}
                            emptyIndicator={
                                <p className="text-center text-lg text-gray-500 leading-10">No results found</p>
                            }
                            renderOption={(option) => (
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-6 h-6 border border-white">
                                        {option.image ? (
                                            <AvatarImage
                                                src={`${HOST}/${option.image}`}
                                                alt="profile"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div
                                                className={`w-6 h-6 flex items-center justify-center text-xs rounded-full text-white font-bold`}
                                                style={{ backgroundColor: option.color || profileColors[0] }}
                                            >
                                                {option.label.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </Avatar>
                                    <span className="truncate text-white text-sm">{option.label}</span>
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <button className="w-full rounded-lg p-2 mt-4 bg-blue-700 hover:bg-blue-500 transition-all duration-300" onClick={createChannel}>
                            Create Channel
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CreateChannel;