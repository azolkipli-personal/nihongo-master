
import { getAssignments, getUserInfo } from './src/services/wanikani.ts';

// Mock fetch if needed (Node 22 has fetch, but might need polyfill for some headers handling if strict)
// But let's rely on Node 22 native fetch.

const API_KEY = '6c296e88-7aeb-484e-ae7c-5ebd04679042';

async function test() {
  console.log('Testing WaniKani API integration...');
  
  try {
    // 1. Test User Info
    console.log('Fetching user info...');
    const user = await getUserInfo(API_KEY);
    console.log('User:', user.username, '| Level:', user.level);
    
    // 2. Test Assignments (Pagination)
    console.log('Fetching assignments (this tests the new pagination loop)...');
    const assignments = await getAssignments(API_KEY);
    console.log('Total assignments fetched:', assignments.length);
    
    if (assignments.length > 1000) {
      console.log('SUCCESS: Pagination is likely working (more than 1 standard page fetched).');
    } else {
      console.log('NOTE: Count is small, might fit in one page or user is new.');
    }
    
    console.log('First assignment:', assignments[0]);
    
  } catch (error) {
    console.error('TEST FAILED:', error);
  }
}

test();
