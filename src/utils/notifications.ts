import { db } from "@/firebaseConfig";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy } from "firebase/firestore";

export interface Notification {
  firestoreId: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'announcement' | 'conversation' | 'system';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'],
  relatedId?: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
) => {
  try {
    const notificationData = {
      userId,
      title,
      message,
      type,
      relatedId,
      isRead: false,
      createdAt: serverTimestamp(),
      priority
    };

    await addDoc(collection(db, "notifications"), notificationData);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      notifications.push({ firestoreId: doc.id, ...doc.data() } as Notification);
    });
    callback(notifications);
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { updateDoc, doc } = await import("firebase/firestore");
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { isRead: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { updateDoc, getDocs, query, where } = await import("firebase/firestore");
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map((doc) => 
      updateDoc(doc.ref, { isRead: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
};

export const getNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { getDocs, query, where, collection } = await import("firebase/firestore");
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting notification count:", error);
    return 0;
  }
}; 