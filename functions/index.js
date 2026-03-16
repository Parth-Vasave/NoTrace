const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const database = admin.database();

/**
 * Scheduled function to prune rooms older than 24 hours.
 * Runs every day at midnight.
 */
exports.cleanupOldRooms = functions.pubsub.schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours in ms
    
    console.log(`Starting cleanup. Cutoff time: ${new Date(cutoff).toISOString()}`);
    
    const roomsRef = database.ref('rooms');
    const snapshot = await roomsRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('No rooms found to cleanup.');
      return null;
    }
    
    const rooms = snapshot.val();
    const updates = {};
    let prunedCount = 0;
    
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      // Use createdAt as the primary marker for room age
      if (room.createdAt && room.createdAt < cutoff) {
        console.log(`Pruning room: ${roomCode} (Created: ${new Date(room.createdAt).toISOString()})`);
        updates[roomCode] = null;
        prunedCount++;
      }
    }
    
    if (prunedCount > 0) {
      await roomsRef.update(updates);
      console.log(`Cleanup complete. Pruned ${prunedCount} rooms.`);
    } else {
      console.log('No rooms met the pruning criteria.');
    }
    
    return null;
  });
