const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.onNewMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const messageId = context.params.messageId;

    try {
      // Get course participants
      const courseRef = admin.firestore().collection('courses').doc(message.courseId);
      const courseDoc = await courseRef.get();
      
      if (!courseDoc.exists) {
        console.log('Course not found:', message.courseId);
        return null;
      }

      const course = courseDoc.data();
      
      // Get all students and teachers in the course
      const studentsQuery = admin.firestore()
        .collection('students')
        .where('cursoId', '==', message.courseId);
      
      const teachersQuery = admin.firestore()
        .collection('teachers')
        .where('firestoreId', 'in', course.teacherIds || []);

      const [studentsSnapshot, teachersSnapshot] = await Promise.all([
        studentsQuery.get(),
        teachersQuery.get()
      ]);

      const participants = [
        ...studentsSnapshot.docs.map(doc => ({ id: doc.id, role: 'alumno' })),
        ...teachersSnapshot.docs.map(doc => ({ id: doc.id, role: 'docente' }))
      ];

      // Create notifications for all participants except the author
      const notificationPromises = participants
        .filter(participant => participant.id !== message.authorId)
        .map(participant => {
          const notificationData = {
            userId: participant.id,
            title: `Nuevo mensaje en ${course.nombre}`,
            message: `${message.authorName}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
            type: 'message',
            relatedId: messageId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            priority: message.priority || 'medium'
          };

          return admin.firestore().collection('notifications').add(notificationData);
        });

      await Promise.all(notificationPromises);
      console.log(`Created ${notificationPromises.length} notifications for message ${messageId}`);
      
      return null;
    } catch (error) {
      console.error('Error creating notifications:', error);
      return null;
    }
  });

exports.onNewAnnouncement = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    const announcement = snap.data();
    const announcementId = context.params.announcementId;

    try {
      // Get all users in the system
      const usersQuery = admin.firestore().collection('users').where('status', '==', 'active');
      const usersSnapshot = await usersQuery.get();

      // Create notifications for all active users
      const notificationPromises = usersSnapshot.docs
        .filter(userDoc => userDoc.id !== announcement.authorId)
        .map(userDoc => {
          const notificationData = {
            userId: userDoc.id,
            title: `Nuevo anuncio: ${announcement.title}`,
            message: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : ''),
            type: 'announcement',
            relatedId: announcementId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            priority: announcement.priority || 'medium'
          };

          return admin.firestore().collection('notifications').add(notificationData);
        });

      await Promise.all(notificationPromises);
      console.log(`Created ${notificationPromises.length} notifications for announcement ${announcementId}`);
      
      return null;
    } catch (error) {
      console.error('Error creating announcement notifications:', error);
      return null;
    }
  });

exports.onNewConversationMessage = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const conversationId = context.params.conversationId;
    const messageId = context.params.messageId;

    try {
      // Get conversation participants
      const conversationRef = admin.firestore().collection('conversations').doc(conversationId);
      const conversationDoc = await conversationRef.get();
      
      if (!conversationDoc.exists) {
        console.log('Conversation not found:', conversationId);
        return null;
      }

      const conversation = conversationDoc.data();
      
      // Create notifications for all participants except the author
      const notificationPromises = conversation.participants
        .filter(participantId => participantId !== message.authorId)
        .map(participantId => {
          const notificationData = {
            userId: participantId,
            title: `Nuevo mensaje en conversación`,
            message: `${message.authorName}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
            type: 'conversation',
            relatedId: conversationId,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            priority: 'medium'
          };

          return admin.firestore().collection('notifications').add(notificationData);
        });

      await Promise.all(notificationPromises);
      console.log(`Created ${notificationPromises.length} notifications for conversation message ${messageId}`);
      
      return null;
    } catch (error) {
      console.error('Error creating conversation notifications:', error);
      return null;
    }
  }); 