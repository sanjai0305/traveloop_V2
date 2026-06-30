import { 
  subscribeToMessages, 
  updatePresence, 
  subscribePresence, 
  updateTyping, 
  subscribeTyping
} from "../services/chatService";

class ChatTransport {
  constructor() {
    this.listeners = {
      message: [],
      edited: [],
      deleted: [],
      reaction: [],
      presence: [],
      roomPresence: [],
      typing: [],
      stopTyping: [],
      connect: [],
      disconnect: [],
      readStatus: [],
    };
    this.activeTripId = null;
    this.messageUnsubscribe = null;
    this.presenceUnsubscribe = null;
    this.typingUnsubscribe = null;
    this.prevMessages = [];
    this.connected = false;
    this.prevTypers = [];
  }

  connect(token) {
    if (this.connected) return;
    this.connected = true;
    console.log("[ChatTransport] Connected to Firebase realtime engine");
    setTimeout(() => {
      this.listeners.connect.forEach((cb) => cb());
    }, 0);
  }

  getUser() {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        return {
          id: u.id || u._id,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          avatar: u.avatar || "",
        };
      }
    } catch (e) {
      console.error("Error reading user from localStorage:", e);
    }
    return { id: "temp", firstName: "System", lastName: "User", avatar: "" };
  }

  joinRoom(tripId) {
    if (this.activeTripId === tripId) return;
    this.leaveRoom();
    
    this.activeTripId = tripId;
    const currentUser = this.getUser();
    
    // Subscribe to Firestore Messages
    this.prevMessages = [];
    this.messageUnsubscribe = subscribeToMessages(tripId, (messages) => {
      // Diff messages to trigger events
      messages.forEach((msg) => {
        const prev = this.prevMessages.find((pm) => pm.id === msg.id);
        if (!prev) {
          // New Message! Trigger newMessage event
          this.listeners.message.forEach((cb) => cb(msg));
        } else {
          // Check if edited
          if (msg.editedAt && msg.editedAt !== prev.editedAt) {
            this.listeners.edited.forEach((cb) => cb(msg));
          }
          // Check if deleted
          if (msg.deletedAt && !prev.deletedAt) {
            this.listeners.deleted.forEach((cb) => cb({ messageId: msg.id }));
          }
          // Check if reactions changed
          const prevReactions = prev.reactions || [];
          const currentReactions = msg.reactions || [];
          if (JSON.stringify(prevReactions) !== JSON.stringify(currentReactions)) {
            this.listeners.reaction.forEach((cb) => cb({ messageId: msg.id, reactions: currentReactions }));
          }
        }
      });
      
      this.prevMessages = messages;
    });

    // Update presence to online
    updatePresence(tripId, currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, currentUser.avatar, true);

    // Subscribe to presence
    this.presenceUnsubscribe = subscribePresence(tripId, (users) => {
      const onlineUserIds = [];
      users.forEach((u) => {
        if (u.status === "online") {
          onlineUserIds.push(u.userId);
        }
        this.listeners.presence.forEach((cb) => cb({
          userId: u.userId,
          status: u.status,
          lastActive: u.lastSeen ? new Date(u.lastSeen) : new Date(),
        }));
      });
      
      this.listeners.roomPresence.forEach((cb) => cb({ onlineUserIds }));
    });

    // Subscribe to typing indicators
    this.typingUnsubscribe = subscribeTyping(tripId, (typingUsers) => {
      const currentTypers = typingUsers.filter(tu => tu.typing && tu.userId !== currentUser.id);
      
      this.prevTypers.forEach((pt) => {
        if (!currentTypers.some(ct => ct.userId === pt.userId)) {
          this.listeners.stopTyping.forEach((cb) => cb({ userId: pt.userId }));
        }
      });
      
      currentTypers.forEach((ct) => {
        if (!this.prevTypers.some(pt => pt.userId === ct.userId)) {
          this.listeners.typing.forEach((cb) => cb({ userId: ct.userId, userName: ct.name }));
        }
      });
      
      this.prevTypers = currentTypers;
    });
  }

  leaveRoom() {
    if (!this.activeTripId) return;
    const tripId = this.activeTripId;
    const currentUser = this.getUser();

    // Mark presence offline
    updatePresence(tripId, currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, currentUser.avatar, false);
    
    // Clear typing indicator
    updateTyping(tripId, currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, false);

    if (this.messageUnsubscribe) {
      this.messageUnsubscribe();
      this.messageUnsubscribe = null;
    }
    if (this.presenceUnsubscribe) {
      this.presenceUnsubscribe();
      this.presenceUnsubscribe = null;
    }
    if (this.typingUnsubscribe) {
      this.typingUnsubscribe();
      this.typingUnsubscribe = null;
    }

    this.activeTripId = null;
  }

  emitTyping(tripId, isTyping) {
    const currentUser = this.getUser();
    updateTyping(tripId, currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, isTyping);
  }

  disconnect() {
    this.leaveRoom();
    this.connected = false;
    this.listeners.disconnect.forEach((cb) => cb("Manual disconnect"));
  }

  isConnected() {
    return this.connected && navigator.onLine;
  }

  // Listener registration
  onConnect(cb) {
    this.listeners.connect.push(cb);
    if (this.connected) cb();
    return () => {
      this.listeners.connect = this.listeners.connect.filter((f) => f !== cb);
    };
  }

  onDisconnect(cb) {
    this.listeners.disconnect.push(cb);
    return () => {
      this.listeners.disconnect = this.listeners.disconnect.filter((f) => f !== cb);
    };
  }

  onMessage(cb) {
    this.listeners.message.push(cb);
    return () => {
      this.listeners.message = this.listeners.message.filter((f) => f !== cb);
    };
  }

  onMessageEdited(cb) {
    this.listeners.edited.push(cb);
    return () => {
      this.listeners.edited = this.listeners.edited.filter((f) => f !== cb);
    };
  }

  onMessageDeleted(cb) {
    this.listeners.deleted.push(cb);
    return () => {
      this.listeners.deleted = this.listeners.deleted.filter((f) => f !== cb);
    };
  }

  onReaction(cb) {
    this.listeners.reaction.push(cb);
    return () => {
      this.listeners.reaction = this.listeners.reaction.filter((f) => f !== cb);
    };
  }

  onPresence(cb) {
    this.listeners.presence.push(cb);
    return () => {
      this.listeners.presence = this.listeners.presence.filter((f) => f !== cb);
    };
  }

  onRoomPresence(cb) {
    this.listeners.roomPresence.push(cb);
    return () => {
      this.listeners.roomPresence = this.listeners.roomPresence.filter((f) => f !== cb);
    };
  }

  onTyping(cb) {
    this.listeners.typing.push(cb);
    return () => {
      this.listeners.typing = this.listeners.typing.filter((f) => f !== cb);
    };
  }

  onStopTyping(cb) {
    this.listeners.stopTyping.push(cb);
    return () => {
      this.listeners.stopTyping = this.listeners.stopTyping.filter((f) => f !== cb);
    };
  }

  onReadStatus(cb) {
    this.listeners.readStatus.push(cb);
    return () => {
      this.listeners.readStatus = this.listeners.readStatus.filter((f) => f !== cb);
    };
  }
}

const transportInstance = new ChatTransport();
export default transportInstance;
