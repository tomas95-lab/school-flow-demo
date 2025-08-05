# SchoolFlow Messaging System

## Overview

The SchoolFlow messaging system provides a comprehensive communication platform with three main components:

1. **Overview Dashboard** - Statistics and recent activity
2. **Conversations** - Real-time chat functionality
3. **Announcements** - Public announcements and wall posts

## Architecture

### Components

- `MessagingModule` - Main container component with tab navigation
- `OverviewDashboard` - Statistics and activity overview
- `ConversationsView` - Chat interface with inbox and conversation detail
- `AnnouncementsView` - Announcement creation and feed

### Data Structure

#### Collections

- `messages` - Course wall messages
- `conversations` - Chat conversations
- `announcements` - System announcements
- `notifications` - User notifications

#### Subcollections

- `conversations/{conversationId}/messages` - Chat messages
- `announcements/{announcementId}/comments` - Announcement comments

### Real-time Features

- Live message updates using Firestore listeners
- Typing indicators
- Read receipts
- Real-time notifications

## Features

### Overview Dashboard

- Role-specific statistics
- Recent activity feed
- System-wide metrics
- Quick access to important information

### Conversations

- **Inbox View**
  - List of conversations with unread badges
  - Course filtering
  - Search functionality
  - "Unread only" filter

- **Chat Detail**
  - Real-time message bubbles
  - Typing indicators
  - File attachments
  - Message status (sent/delivered/read)

### Announcements

- **Creation Form**
  - Title and content
  - Course selection (optional)
  - Priority levels
  - Tags and attachments

- **Feed**
  - Chronological display
  - Priority-based highlighting
  - Like and comment system
  - Bookmark functionality

## Notifications

### Cloud Functions

- `onNewMessage` - Triggers when new messages are posted
- `onNewAnnouncement` - Triggers when announcements are created
- `onNewConversationMessage` - Triggers when chat messages are sent

### Notification Types

- **Message** - New course wall messages
- **Announcement** - System-wide announcements
- **Conversation** - Direct chat messages
- **System** - Administrative notifications

## Usage

### Accessing the Messaging Module

Navigate to `/app/mensajes` to access the messaging system. The module automatically adapts based on user role:

- **Admin** - Full access to all features
- **Teacher** - Course-specific messaging and announcements
- **Student** - Limited to enrolled courses

### Creating Messages

1. Select the appropriate tab (Conversations/Announcements)
2. Use the creation form
3. Add attachments if needed
4. Set priority and tags
5. Publish

### Real-time Updates

The system uses Firestore listeners to provide real-time updates:

- New messages appear instantly
- Typing indicators show when others are writing
- Notifications are delivered in real-time
- Read receipts update automatically

## Security Rules

### Firestore Rules

```javascript
// Messages
match /messages/{messageId} {
  allow read: if request.auth != null && 
    (resource.data.courseId in get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.courses);
  allow write: if request.auth != null && 
    (request.auth.uid == resource.data.authorId || 
     get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.role == 'admin');
}

// Conversations
match /conversations/{conversationId} {
  allow read, write: if request.auth != null && 
    request.auth.uid in resource.data.participants;
}

// Announcements
match /announcements/{announcementId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    (request.auth.uid == resource.data.authorId || 
     get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.role in ['admin', 'docente']);
}
```

## Performance Considerations

- Messages are paginated (50 messages per load)
- Images are compressed before upload
- Notifications are batched for efficiency
- Real-time listeners are properly cleaned up

## Future Enhancements

- Push notifications
- Message encryption
- Advanced search with filters
- Message scheduling
- Rich text editor
- Voice messages
- Video calls integration 