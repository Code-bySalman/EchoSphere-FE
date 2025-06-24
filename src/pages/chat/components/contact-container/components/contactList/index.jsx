import React from 'react';
import { useAppStore } from '@/store';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { profileColors } from "@/lib/utils";

const ContactList = () => {
    const { userContacts, setSelectedChatType, setSelectedChatData, setSelectedChatMessages } = useAppStore();

    const handleContactClick = (contact) => {
        console.log("[ContactList] Contact clicked:", contact);

        setSelectedChatType("user");
        setSelectedChatData({
            _id: contact._id,
            email: contact.email,
            name: contact.name,
            image: contact.image,
            color: contact.color,
        });
        setSelectedChatMessages([]);
    };

    if (userContacts.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400">
                No recent contacts. Start a new chat!
            </div>
        );
    }

    return (
        <ScrollArea className="h-full w-full">
            <div className="p-4">
                {userContacts.map((contact) => (
                    <div
                        key={contact._id}
                        className="mb-3 p-3 rounded-lg bg-gray-800/60 hover:bg-gray-700/60
                                   border border-gray-700/50 transition-colors duration-200
                                   flex items-center gap-3 cursor-pointer"
                        onClick={() => handleContactClick(contact)}
                    >
                        {contact.image ? (
                            <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                                <AvatarImage
                                    src={contact.image}
                                    alt={contact.name}
                                    className="object-cover h-full w-full"
                                />
                            </Avatar>
                        ) : (
                            <div
                                className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: contact.color || profileColors[0] }}
                            >
                                {contact.name ? contact.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                        <span className="text-white text-base">{contact.name}</span>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};

export default ContactList;