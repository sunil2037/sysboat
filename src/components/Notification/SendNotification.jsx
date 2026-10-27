import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../Apis/Services/ServerURL';
import { toast } from '../../Helper/ToastManager';

const socket = io(API_BASE_URL);

export const SendNotification = async ({
  receiver_id,
  title,
  message,
  page_url,
  img_url,
  notification_type,
  sender_id,
  company_id,
  NotificationSend,
  userData,
}) => {
  const payload = {
    receiver_id,
    title,
    message,
    page_url,
    img_url,
    notification_type,
    sender_id,
    company_id,
    userData,
  };
  socket.emit('send-notification', payload);

  try {
    const response = await NotificationSend(payload);
    toast.success('Notification sent successfully');

    return response;
  } catch (error) {
    toast.error(error.message);
    throw error;
  }
};
