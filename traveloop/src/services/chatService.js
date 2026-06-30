import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp, 
  arrayUnion 
} from "firebase/firestore";
import { 
  ref as rRef, 
  set as rSet, 
  onValue as rOnValue, 
  onDisconnect as rOnDisconnect, 
  remove as rRemove 
} from "firebase/database";
import { 
  ref as sRef, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { db, rtdb, storage } from "./firebase";

// Helper to convert dataURL/base64 to Blob
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Compress base64 image if it exceeds 500KB
export const compressImageIfNeeded = async (base64Str) => {
  const approximateSize = (base64Str.length * 3) / 4;
  if (approximateSize < 500 * 1024) {
    return base64Str;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 1280;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => reject(err);
    img.src = base64Str;
  });
};

// Bootstrap trip member documents in Firestore
export const bootstrapTripMembers = async (tripId, trip, currentUser) => {
  try {
    const membersRef = collection(db, "trips", tripId, "members");
    const membersToCreate = [];

    const ownerId = (trip.owner?._id || trip.owner || trip.user?._id || trip.user)?.toString();
    if (ownerId) {
      membersToCreate.push({
        userId: ownerId,
        role: "owner",
      });
    }

    trip.collaborators?.forEach((c) => {
      const cId = (c.userId?._id || c.userId)?.toString();
      if (cId) {
        membersToCreate.push({
          userId: cId,
          role: c.role || "editor",
        });
      }
    });

    for (const member of membersToCreate) {
      const memberDocRef = doc(membersRef, member.userId);
      const snap = await getDoc(memberDocRef);
      if (!snap.exists()) {
        await setDoc(memberDocRef, {
          role: member.role,
          unreadCount: 0,
          lastSeenAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error("Error bootstrapping trip members:", error);
  }
};

// Subscribe to messages
export const subscribeToMessages = (tripId, callback) => {
  const messagesCollectionRef = collection(db, "trips", tripId, "messages");
  const q = query(messagesCollectionRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const rawReactions = data.reactions || {};
      const reactionsArray = Array.isArray(rawReactions)
        ? rawReactions
        : Object.entries(rawReactions).map(([uid, emo]) => ({ userId: uid, emoji: emo }));

      messages.push({
        id: d.id,
        _id: d.id, // compatibility
        ...data,
        reactions: reactionsArray,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        editedAt: data.editedAt?.toDate ? data.editedAt.toDate().toISOString() : data.editedAt,
        deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate().toISOString() : data.deletedAt,
        sender: data.senderId || data.sender, // compatibility
      });
    });

    // Populate replyToDetails on client side
    messages.forEach((m) => {
      if (m.replyTo) {
        const parentId = typeof m.replyTo === "object" ? m.replyTo.messageId : m.replyTo;
        const parent = messages.find((p) => p.id === parentId);
        if (parent) {
          m.replyToDetails = parent;
        }
      }
    });

    callback(messages, snapshot.metadata.hasPendingWrites);
  }, (error) => {
    console.error("subscribeToMessages error:", error);
  });
};

// Send a message
export const sendMessage = async (tripId, payload) => {
  let fileUrl = payload.fileUrl || "";

  if (fileUrl && fileUrl.startsWith("data:")) {
    let blob;
    let fileName = `chat_file_${Date.now()}`;
    if (payload.messageType === "voice") {
      blob = dataURLtoBlob(fileUrl);
      fileName = `${fileName}.mp3`;
    } else {
      const compressedBase64 = await compressImageIfNeeded(fileUrl).catch((err) => {
        console.error("Compression failed, using original:", err);
        return fileUrl;
      });
      blob = dataURLtoBlob(compressedBase64);
      fileName = `${fileName}.jpg`;
    }
    const fileRef = sRef(storage, `trip-chat/${tripId}/${fileName}`);
    const snapshot = await uploadBytes(fileRef, blob);
    fileUrl = await getDownloadURL(snapshot.ref);
  }

  const messagesCollectionRef = collection(db, "trips", tripId, "messages");
  const messageDocRef = doc(messagesCollectionRef);
  const messageId = messageDocRef.id;

  await runTransaction(db, async (transaction) => {
    const membersCollectionRef = collection(db, "trips", tripId, "members");
    const membersSnap = await getDocs(membersCollectionRef);

    membersSnap.forEach((memberDoc) => {
      const memberId = memberDoc.id;
      if (memberId !== payload.senderId) {
        const memberDocRef = doc(membersCollectionRef, memberId);
        const currentUnread = memberDoc.data().unreadCount || 0;
        transaction.update(memberDocRef, {
          unreadCount: currentUnread + 1,
        });
      }
    });

    transaction.set(messageDocRef, {
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderAvatar: payload.senderAvatar,
      message: payload.message || "",
      messageType: payload.messageType || "text",
      imageUrl: fileUrl,
      fileUrl: fileUrl,
      createdAt: serverTimestamp(),
      editedAt: null,
      deletedAt: null,
      replyTo: payload.replyTo || null,
      reactions: {},
      seenBy: [payload.senderId],
      version: 1,
      location: payload.location || null,
      itineraryItem: payload.itineraryItem || null,
    });
  });

  return { id: messageId, fileUrl };
};

// Edit message
export const editMessage = async (tripId, messageId, text) => {
  const docRef = doc(db, "trips", tripId, "messages", messageId);
  await updateDoc(docRef, {
    message: text,
    editedAt: serverTimestamp(),
    version: 2,
  });
};

// Delete message
export const deleteMessage = async (tripId, messageId) => {
  const docRef = doc(db, "trips", tripId, "messages", messageId);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
  });
};

// Add reaction
export const addReaction = async (tripId, messageId, userId, emoji) => {
  const docRef = doc(db, "trips", tripId, "messages", messageId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    let reactions = data.reactions || {};
    if (Array.isArray(reactions)) {
      const map = {};
      reactions.forEach((r) => {
        if (r.userId) map[r.userId] = r.emoji;
      });
      reactions = map;
    }
    
    if (reactions[userId] === emoji) {
      delete reactions[userId];
    } else {
      reactions[userId] = emoji;
    }
    await updateDoc(docRef, { reactions });
  }
};

// Mark as seen
export const markSeen = async (tripId, userId) => {
  try {
    const memberDocRef = doc(db, "trips", tripId, "members", userId);
    await updateDoc(memberDocRef, {
      unreadCount: 0,
      lastSeenAt: serverTimestamp(),
    });

    const messagesCollectionRef = collection(db, "trips", tripId, "messages");
    const messagesSnap = await getDocs(messagesCollectionRef);
    for (const mDoc of messagesSnap.docs) {
      const mData = mDoc.data();
      const seenBy = mData.seenBy || [];
      if (!seenBy.includes(userId)) {
        await updateDoc(mDoc.ref, {
          seenBy: arrayUnion(userId),
        });
      }
    }
  } catch (error) {
    console.error("Error marking chat as seen:", error);
  }
};

// Subscribe to unread count
export const subscribeUnreadCount = (tripId, userId, callback) => {
  const docRef = doc(db, "trips", tripId, "members", userId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().unreadCount || 0);
    } else {
      callback(0);
    }
  }, (err) => {
    console.error("subscribeUnreadCount error:", err);
    callback(0);
  });
};

// Presence: update status
export const updatePresence = async (tripId, userId, name, avatar, online) => {
  try {
    const presenceRef = rRef(rtdb, `presence/${tripId}/${userId}`);
    const status = {
      userId,
      name,
      avatar,
      status: online ? "online" : "offline",
      lastSeen: Date.now(),
    };
    await rSet(presenceRef, status);
    if (online) {
      rOnDisconnect(presenceRef).set({
        ...status,
        status: "offline",
        lastSeen: Date.now(),
      });
    }
  } catch (err) {
    console.error("updatePresence error:", err);
  }
};

// Presence: subscribe to status updates
export const subscribePresence = (tripId, callback) => {
  const presenceRef = rRef(rtdb, `presence/${tripId}`);
  return rOnValue(presenceRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.values(data));
  }, (error) => {
    console.error("subscribePresence error:", error);
  });
};

// Typing: update status
export const updateTyping = async (tripId, userId, name, typing) => {
  try {
    const typingRef = rRef(rtdb, `typing/${tripId}/${userId}`);
    if (typing) {
      await rSet(typingRef, { userId, name, typing: true });
    } else {
      await rRemove(typingRef);
    }
  } catch (err) {
    console.error("updateTyping error:", err);
  }
};

// Typing: subscribe to status updates
export const subscribeTyping = (tripId, callback) => {
  const typingRef = rRef(rtdb, `typing/${tripId}`);
  return rOnValue(typingRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.values(data));
  }, (error) => {
    console.error("subscribeTyping error:", error);
  });
};

// Members seen status: subscribe to lastSeenAt updates
export const subscribeMembersSeen = (tripId, callback) => {
  const membersRef = collection(db, "trips", tripId, "members");
  return onSnapshot(membersRef, (snapshot) => {
    const states = {};
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.lastSeenAt) {
        states[d.id] = data.lastSeenAt.toDate ? data.lastSeenAt.toDate() : new Date(data.lastSeenAt);
      }
    });
    callback(states);
  }, (error) => {
    console.error("subscribeMembersSeen error:", error);
  });
};

// Pin/unpin message
export const togglePinMessage = async (tripId, messageId, pin) => {
  const docRef = doc(db, "trips", tripId, "messages", messageId);
  await updateDoc(docRef, {
    pinned: pin,
    pinnedAt: pin ? serverTimestamp() : null
  });
};
