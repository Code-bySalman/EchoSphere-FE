export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = "/api/auth";
export const CONTACT_ROUTE = "/api/contacts";


export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;
export const USER_INFO = `${AUTH_ROUTES}/user-info`;
export const SETUP_PROFILE = `${AUTH_ROUTES}/setup-profile`;
export const UPDATE_PROFILE = `${AUTH_ROUTES}/update-profile`;
export const UPLOAD_IMAGE = `${AUTH_ROUTES}/upload-image`;
export const DELETE_IMAGE = `${AUTH_ROUTES}/delete-image`;
export const LOGOUT_ROUTE = `${AUTH_ROUTES}/logout`;


export const SEARCH_CONTACT_ROUTE = `${CONTACT_ROUTE}/search`;
export const GET_CONTACTS_TO_DM_ROUTES  = `${CONTACT_ROUTE}/get-contacts-to-dm`
export const GET_CONTACTS_FOR_CHANNEL  = `${CONTACT_ROUTE}/create-channel`


export const MESSAGE_ROUTE = "api/messages";
export const GET_ALL_MESSAGES = `${MESSAGE_ROUTE}/get-messages`
export const UPLOAD_FILE = `${MESSAGE_ROUTE}/upload-file`

export const CHANNEL_ROUTE = "api/channel";
export const CREATE_CHANNEL_ROUTE = `${CHANNEL_ROUTE}/create-group`
export const CREATE_USER_CHANNEL_ROUTE = `${CHANNEL_ROUTE}/create-user-group`
export const GET_CHANNEL_MESSAGES_ROUTE = (channelId) => `${CHANNEL_ROUTE}/${channelId}/messages`;