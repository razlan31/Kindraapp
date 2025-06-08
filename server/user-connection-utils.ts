import { storage } from './storage';
import type { User } from '@shared/schema';

export async function ensureUserConnection(user: User): Promise<void> {
  try {
    // Check if user already has a "Self" connection
    const connections = await storage.getConnectionsByUserId(user.id);
    const selfConnection = connections.find(conn => 
      conn.relationshipStage === "Self" || 
      conn.name.endsWith("(ME)")
    );

    if (selfConnection) {
      console.log(`User ${user.id} already has a self connection`);
      return;
    }

    // Create user connection
    const userConnectionData = {
      userId: user.id,
      name: `${user.displayName || user.username} (ME)`,
      relationshipStage: "Self",
      zodiacSign: user.zodiacSign,
      loveLanguage: user.loveLanguage,
      isPrivate: false,
      profileImage: user.profileImage,
      startDate: null,
      birthday: null,
      isArchived: false
    };

    const userConnection = await storage.createConnection(userConnectionData);
    console.log(`Created user connection for user ${user.id}:`, userConnection.id);
  } catch (error) {
    console.error(`Failed to create user connection for user ${user.id}:`, error);
    // Don't throw - this shouldn't block other operations
  }
}

export async function createUserConnectionsForAllUsers(): Promise<void> {
  try {
    // This would need to be implemented in storage if we wanted to migrate all users
    console.log("Bulk user connection creation not implemented yet");
  } catch (error) {
    console.error("Failed to create user connections for all users:", error);
  }
}