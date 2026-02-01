
import { syncVocabulary } from './src/services/wanikani.ts';

const API_KEY = '6c296e88-7aeb-484e-ae7c-5ebd04679042';

async function testFullSync() {
  console.log('Testing Full Sync (Assignments + Subjects)...');
  try {
    const items = await syncVocabulary(API_KEY);
    console.log(`Successfully synced ${items.length} vocabulary items.`);
    if (items.length > 0) {
        console.log('First item:', items[0].characters);
    }
  } catch (error) {
    console.error('SYNC FAILED:', error);
  }
}

testFullSync();
