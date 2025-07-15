export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
  reply_to_message?: TelegramMessage;
  entities?: TelegramMessageEntity[];
  document?: TelegramDocument;
  photo?: TelegramPhotoSize[];
  voice?: TelegramVoice;
  video?: TelegramVideo;
  audio?: TelegramAudio;
  sticker?: TelegramSticker;
  location?: TelegramLocation;
  contact?: TelegramContact;
}

export interface TelegramMessageEntity {
  type: 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' | 'email' | 'phone_number' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'pre' | 'text_link' | 'text_mention';
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
}

export interface TelegramDocument {
  file_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramPhotoSize {
  file_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramVoice {
  file_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramVideo {
  file_id: string;
  width: number;
  height: number;
  duration: number;
  thumb?: TelegramPhotoSize;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramAudio {
  file_id: string;
  duration: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
  thumb?: TelegramPhotoSize;
}

export interface TelegramSticker {
  file_id: string;
  width: number;
  height: number;
  thumb?: TelegramPhotoSize;
  emoji?: string;
  set_name?: string;
  file_size?: number;
}

export interface TelegramLocation {
  longitude: number;
  latitude: number;
}

export interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  inline_query?: TelegramInlineQuery;
  chosen_inline_result?: TelegramChosenInlineResult;
  callback_query?: TelegramCallbackQuery;
  shipping_query?: TelegramShippingQuery;
  pre_checkout_query?: TelegramPreCheckoutQuery;
  poll?: TelegramPoll;
  poll_answer?: TelegramPollAnswer;
  my_chat_member?: TelegramChatMemberUpdated;
  chat_member?: TelegramChatMemberUpdated;
  chat_join_request?: TelegramChatJoinRequest;
}

export interface TelegramInlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
  chat_type?: string;
  location?: TelegramLocation;
}

export interface TelegramChosenInlineResult {
  result_id: string;
  from: TelegramUser;
  location?: TelegramLocation;
  inline_message_id?: string;
  query: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
  game_short_name?: string;
}

export interface TelegramShippingQuery {
  id: string;
  from: TelegramUser;
  invoice_payload: string;
  shipping_address: TelegramShippingAddress;
}

export interface TelegramPreCheckoutQuery {
  id: string;
  from: TelegramUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
  shipping_option_id?: string;
  order_info?: TelegramOrderInfo;
}

export interface TelegramPoll {
  id: string;
  question: string;
  options: TelegramPollOption[];
  total_voter_count: number;
  is_closed: boolean;
  is_anonymous: boolean;
  type: string;
  allows_multiple_answers: boolean;
  correct_option_id?: number;
  explanation?: string;
  explanation_entities?: TelegramMessageEntity[];
  open_period?: number;
  close_date?: number;
}

export interface TelegramPollOption {
  text: string;
  voter_count: number;
}

export interface TelegramPollAnswer {
  poll_id: string;
  user: TelegramUser;
  option_ids: number[];
}

export interface TelegramChatMemberUpdated {
  chat: TelegramChat;
  from: TelegramUser;
  date: number;
  old_chat_member: TelegramChatMember;
  new_chat_member: TelegramChatMember;
  invite_link?: TelegramChatInviteLink;
}

export interface TelegramChatMember {
  user: TelegramUser;
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  custom_title?: string;
  is_anonymous?: boolean;
  can_be_edited?: boolean;
  can_manage_chat?: boolean;
  can_delete_messages?: boolean;
  can_manage_video_chats?: boolean;
  can_restrict_members?: boolean;
  can_promote_members?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_pin_messages?: boolean;
  can_post_stories?: boolean;
  can_edit_stories?: boolean;
  can_delete_stories?: boolean;
  is_member?: boolean;
  can_send_messages?: boolean;
  can_send_audios?: boolean;
  can_send_documents?: boolean;
  can_send_photos?: boolean;
  can_send_videos?: boolean;
  can_send_video_notes?: boolean;
  can_send_voice_notes?: boolean;
  can_send_polls?: boolean;
  can_send_other_messages?: boolean;
  can_add_web_page_previews?: boolean;
  until_date?: number;
}

export interface TelegramChatJoinRequest {
  chat: TelegramChat;
  from: TelegramUser;
  date: number;
  bio?: string;
  invite_link?: TelegramChatInviteLink;
}

export interface TelegramChatInviteLink {
  invite_link: string;
  creator: TelegramUser;
  creates_join_request: boolean;
  is_primary: boolean;
  is_revoked: boolean;
  name?: string;
  expire_date?: number;
  member_count?: number;
  pending_join_request_count?: number;
}

export interface TelegramShippingAddress {
  country_code: string;
  state: string;
  city: string;
  street_line1: string;
  street_line2: string;
  post_code: string;
}

export interface TelegramOrderInfo {
  name?: string;
  phone_number?: string;
  email?: string;
  shipping_address?: TelegramShippingAddress;
}

export interface BotSession {
  userId: number;
  chatId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  isActive: boolean;
  lastActivity: Date;
  conversationMode: 'general' | 'code' | 'research' | 'reasoning';
  memoryContext: string[];
  autonomousTasks: string[];
  preferences: {
    language: string;
    responseLength: 'short' | 'medium' | 'long';
    includeCode: boolean;
    includeLinks: boolean;
  };
  usageStats: {
    messagesSent: number;
    commandsUsed: number;
    lastCommand: string;
    sessionStart: Date;
  };
}

export interface BotCommand {
  command: string;
  description: string;
  handler: (message: TelegramMessage, session: BotSession) => Promise<void>;
  adminOnly?: boolean;
  requiresAuth?: boolean;
}

export interface BotResponse {
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  replyToMessageId?: number;
  keyboard?: TelegramInlineKeyboardMarkup;
  removeKeyboard?: boolean;
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

export interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: TelegramWebAppInfo;
  login_url?: TelegramLoginUrl;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  callback_game?: TelegramCallbackGame;
  pay?: boolean;
}

export interface TelegramWebAppInfo {
  url: string;
}

export interface TelegramLoginUrl {
  url: string;
  forward_text?: string;
  bot_username?: string;
  request_write_access?: boolean;
}

export interface TelegramCallbackGame {
  user_id: number;
  score: number;
  force?: boolean;
  disable_edit_message?: boolean;
  chat_id?: number;
  message_id?: number;
  inline_message_id?: string;
} 