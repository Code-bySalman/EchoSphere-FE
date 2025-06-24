import React, { useEffect, useState } from 'react';
import ProfileInfo from './components/profileInfo';
import NewDm from './components/new-dm';
import ContactList from './components/contactList';
import ChannelList from './components/channelList';
import { apiClient } from '@/lib/api-client';
import {GET_CONTACTS_TO_DM_ROUTES,CREATE_USER_CHANNEL_ROUTE} from '@/utils/constants';
import { useAppStore } from '@/store';
import CreateChannel from './components/create-channel';

const ContactContainer = () => {
    const { userInfo, setUserContacts, setChannel } = useAppStore();
    const [showDmList, setShowDmList] = useState(true);
    const [showChannelList, setShowChannelList] = useState(false);

    useEffect(() => {
        const getContacts = async () => {
            if (userInfo?.id) {
                try {
                    const response = await apiClient.get(GET_CONTACTS_TO_DM_ROUTES, {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${userInfo.token}`,
                        },
                    });
                    if (response.data.contacts) {
                        console.log("Fetched contacts to DM:", response.data.contacts);
                        setUserContacts(response.data.contacts);
                    }
                } catch (error) {
                    console.error("Error fetching contacts to DM:", error);
                    setUserContacts([]);
                }
            } else {
                console.log("User info not available, not fetching contacts to DM.");
                setUserContacts([]);
            }
        };

        const getUserChannels = async () => {
            if (userInfo?.id) {
                try {
                    // Use CREATE_USER_CHANNEL_ROUTE for the GET request
                    const response = await apiClient.get(CREATE_USER_CHANNEL_ROUTE, {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${userInfo.token}`,
                        },
                    });
                    if (response.data.channels) {
                        console.log("Fetched channels:", response.data.channels);
                        setChannel(response.data.channels);
                    } else {
                        console.warn("No 'channels' data found in API response for channels.");
                        setChannel([]);
                    }
                } catch (error) {
                    console.error("Error fetching user channels:", error);
                    setChannel([]);
                }
            } else {
                console.log("User info not available, not fetching channels.");
                setChannel([]);
            }
        };

        getContacts();
        getUserChannels();
    }, [userInfo, setUserContacts, setChannel]);

    const toggleDmList = () => {
        setShowDmList(!showDmList);
        if (!showDmList) setShowChannelList(false);
    };

    const toggleChannelList = () => {
        setShowChannelList(!showChannelList);
        if (!showChannelList) setShowDmList(false);
    };

    return (
        <div className='relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] w-full h-full flex flex-col
                         bg-gradient-to-br from-gray-900 to-black border-r border-white/5
                         shadow-lg overflow-hidden'>

            <div className="p-4 text-center text-3xl font-extrabold
                             bg-gradient-to-r from-purple-700 to-blue-600
                             text-transparent bg-clip-text
                             border-b border-white/10 shadow-inner-lg">
                <span className='text-white text-3xl'>Echo</span>Sphere
            </div>

            <div className="p-2 flex flex-col gap-2 border-b border-white/5">
                <div
                    className="p-3 text-lg flex items-center justify-between font-semibold text-gray-200 cursor-pointer
                                 bg-white/5 backdrop-blur-sm rounded-lg
                                 hover:bg-white/10 transition-colors duration-200"
                    onClick={toggleDmList}
                >
                    Direct Messages
                    <div className="flex items-center gap-2">
                        <NewDm />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform duration-300 ${showDmList ? 'rotate-90' : 'rotate-0'}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

                <div
                    className={`
                        transition-all duration-300 ease-in-out overflow-hidden
                        ${showDmList ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                    `}
                >
                    <ContactList />
                </div>

                <div
                    className="p-3 text-lg flex items-center justify-between font-semibold text-gray-200 cursor-pointer
                                 bg-white/5 backdrop-blur-sm rounded-lg
                                 hover:bg-white/10 transition-colors duration-200"
                    onClick={toggleChannelList}
                >
                    Channels
                    <div className="flex items-center gap-2">
                        <CreateChannel />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform duration-300 ${showChannelList ? 'rotate-90' : 'rotate-0'}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

                <div
                    className={`
                        transition-all duration-300 ease-in-out overflow-hidden
                        ${showChannelList ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                    `}
                >
                    <ChannelList />
                </div>
            </div>

            <ProfileInfo />

        </div>
    );
};

export default ContactContainer;