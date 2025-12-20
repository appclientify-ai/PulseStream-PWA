
import { getCollection } from './mongo.js';

/**
 * Sets up MongoDB Change Streams to watch for data changes and broadcast them via Socket.IO.
 * This ensures all clients are synced even if changes happen directly in the database.
 */
export function initChangeStreams(io) {
  const watchConfig = { fullDocument: 'updateLookup' };
  
  // Watch the 'items' collection
  const watchItems = () => {
    try {
      const itemsCollection = getCollection('items');
      const itemStream = itemsCollection.watch([], watchConfig);

      itemStream.on('change', (change) => {
        const payload = {
          type: change.operationType, // 'insert', 'update', 'delete', 'replace'
          data: change.fullDocument,
          id: change.documentKey._id,
          updatedFields: change.updateDescription?.updatedFields,
          timestamp: new Date()
        };

        console.log(`[Stream] Item ${payload.type}:`, payload.id);
        
        // Broadcast the specific DB change event
        io.emit('db_item_change', payload);
        
        // Backward compatibility: emit specific event if inserted
        if (change.operationType === 'insert') {
          io.emit('item_created', change.fullDocument);
        }
      });

      itemStream.on('error', (err) => {
        console.error('[Stream] Item stream error:', err.message);
        itemStream.close();
        // Exponential backoff or simple delay for reconnection
        setTimeout(watchItems, 5000);
      });
    } catch (err) {
      console.warn('[Stream] Could not start items watch. Likely standalone DB.', err.message);
    }
  };

  // Watch the 'users' collection for status or profile changes
  const watchUsers = () => {
    try {
      const usersCollection = getCollection('users');
      const userStream = usersCollection.watch([], watchConfig);

      userStream.on('change', (change) => {
        const payload = {
          type: change.operationType,
          id: change.documentKey._id,
          username: change.fullDocument?.username,
          status: change.fullDocument?.status,
          updatedFields: change.updateDescription?.updatedFields
        };

        console.log(`[Stream] User ${payload.type}:`, payload.username || payload.id);
        io.emit('db_user_change', payload);
      });

      userStream.on('error', (err) => {
        console.error('[Stream] User stream error:', err.message);
        userStream.close();
        setTimeout(watchUsers, 5000);
      });
    } catch (err) {
      console.warn('[Stream] Could not start users watch.', err.message);
    }
  };

  // Initialize watchers
  // Note: MongoDB Change Streams require a Replica Set (standard in production like MongoDB Atlas).
  watchItems();
  watchUsers();
  console.log('📡 MongoDB Change Streams initialized');
}
