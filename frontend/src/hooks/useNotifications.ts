import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NotificationData {
  id: string;
  type: 'comment' | 'status_change' | 'assignment' | 'new_ticket';
  title: string;
  message: string;
  ticketId?: string;
  timestamp: string;
}

export const useNotifications = (onNotification: (notification: NotificationData) => void) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Simulate real-time notifications with periodic checks
    const checkForNotifications = () => {
      // In a real app, you'd use WebSockets or Server-Sent Events
      // For demo, we'll simulate random notifications
      
      const notifications: NotificationData[] = [
        {
          id: Date.now().toString(),
          type: 'comment',
          title: 'New Comment',
          message: 'A support agent replied to your ticket',
          ticketId: 'sample-ticket-id',
          timestamp: new Date().toISOString()
        },
        {
          id: (Date.now() + 1).toString(),
          type: 'status_change',
          title: 'Ticket Status Updated',
          message: 'Your ticket status changed to "In Progress"',
          ticketId: 'sample-ticket-id',
          timestamp: new Date().toISOString()
        },
        {
          id: (Date.now() + 2).toString(),
          type: 'new_ticket',
          title: 'New Ticket Created',
          message: 'A new ticket has been submitted',
          timestamp: new Date().toISOString()
        }
      ];

      // Randomly trigger notifications for demo
      if (Math.random() < 0.1) { // 10% chance every check
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        
        // Only show relevant notifications based on user role
        if (
          (user.role === 'END_USER' && ['comment', 'status_change'].includes(randomNotification.type)) ||
          (user.role !== 'END_USER' && randomNotification.type === 'new_ticket') ||
          user.role === 'ADMIN'
        ) {
          onNotification(randomNotification);
        }
      }
    };

    // Check for notifications every 10 seconds
    const interval = setInterval(checkForNotifications, 10000);

    // Also trigger a welcome notification after 3 seconds
    const welcomeTimeout = setTimeout(() => {
      onNotification({
        id: 'welcome',
        type: 'comment',
        title: 'Welcome to QuickDesk!',
        message: 'You will receive real-time notifications here',
        timestamp: new Date().toISOString()
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(welcomeTimeout);
    };
  }, [user, onNotification]);
};

export default useNotifications;