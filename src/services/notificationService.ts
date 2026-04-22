// services/notificationService.ts

class NotificationService {
  private audio: HTMLAudioElement | null = null;
  private notificationPermission: boolean = false;

  constructor() {
    this.initAudio();
    this.requestNotificationPermission();
  }

  private initAudio() {
    // You can use a custom sound file or a default one
    // Place a notification.mp3 file in your public folder
    this.audio = new Audio("/notification.mp3");
    // Alternative: Use a default web sound
    // this.audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
  }

  private async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission === "granted";
    }
  }

  playSound() {
    if (this.audio) {
      this.audio.currentTime = 0; // Reset to start
      this.audio.play().catch((error) => {});
    }
  }

  showNotification(title: string, body: string, icon?: string) {
    if (!this.notificationPermission) return;

    const notification = new Notification(title, {
      body: body,
      icon: icon || "/lantern-logo.png",
      silent: false,
    });

    // Close notification after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Focus on window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  // Method to check if user is on the chat page
  shouldNotify(
    isOnChatPage: boolean,
    isActiveConversation: boolean,
    messageSenderId: number,
    currentUserId: number,
  ) {
    // Don't notify if:
    // 1. User is not on chat page
    // 2. User is currently in the chat with the sender
    // 3. Message is from the current user (self)

    if (messageSenderId === currentUserId) return false;
    if (isOnChatPage && isActiveConversation) return false;

    return true;
  }
}

export default new NotificationService();
