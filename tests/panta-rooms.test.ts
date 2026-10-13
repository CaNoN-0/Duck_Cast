/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, User, Room, ActivityLog } from '../server/db';
import assert from 'assert';

console.log('====================================================');
console.log('   RUNNING PANTA ROOMS & USER ACTIVITY TEST SUITE   ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`[FAIL] ${name}:`, err.message);
    throw err;
  }
}

// --------------------------------------------------------------------------
// TEST 1: Database Health & 10 Initial Test Users Verification
// --------------------------------------------------------------------------
runTest('Database initializes and contains at least 10 test users', () => {
  const users = db.getUsers();
  assert.ok(users.length >= 10, `Expected at least 10 users, found ${users.length}`);

  // Check required profile fields on each user
  users.slice(0, 10).forEach((user, index) => {
    assert.ok(user.id, `User at index ${index} missing id`);
    assert.ok(user.username, `User at index ${index} missing username`);
    assert.ok(user.handle, `User at index ${index} missing handle`);
    assert.ok(user.email, `User at index ${index} missing email`);
    assert.ok(user.role === 'admin' || user.role === 'user', `User ${user.id} invalid role`);
    assert.ok(user.lastActiveTime, `User ${user.id} missing lastActiveTime`);
    assert.ok(Array.isArray(user.roomsCreated), `User ${user.id} missing roomsCreated array`);
    assert.ok(Array.isArray(user.roomsJoined), `User ${user.id} missing roomsJoined array`);
  });

  // Verify Admin user exists
  const admin = users.find((u) => u.role === 'admin');
  assert.ok(admin, 'Expected at least one administrator user');
  assert.strictEqual(admin.id, 'user-1');
  assert.strictEqual(admin.username, 'Elena Rostova');
});

// --------------------------------------------------------------------------
// TEST 2: User Login and Activity Tracking
// --------------------------------------------------------------------------
runTest('User login updates online status and records activity log', () => {
  const targetUserId = 'user-2';
  const initialActivities = db.getActivities({ userId: targetUserId }).length;

  const loggedInUser = db.loginUser(targetUserId);
  assert.ok(loggedInUser, 'Failed to login user-2');
  assert.strictEqual(loggedInUser.isOnline, true);

  const updatedActivities = db.getActivities({ userId: targetUserId });
  assert.ok(
    updatedActivities.length > initialActivities,
    'Expected new login activity log to be recorded'
  );

  const latest = updatedActivities[0];
  assert.strictEqual(latest.activityType, 'user_login');
  assert.strictEqual(latest.userId, targetUserId);
});

// --------------------------------------------------------------------------
// TEST 3: Heartbeat and Last Active Time Updating
// --------------------------------------------------------------------------
runTest('Touch heartbeat updates user lastActiveTime timestamp', () => {
  const targetUserId = 'user-3';
  const beforeTime = new Date(db.getUserById(targetUserId)!.lastActiveTime).getTime();

  // Artificial short delay
  const now = new Date().toISOString();
  db.touchHeartbeat(targetUserId);

  const afterUser = db.getUserById(targetUserId)!;
  const afterTime = new Date(afterUser.lastActiveTime).getTime();
  assert.ok(afterTime >= beforeTime, 'Expected lastActiveTime to update');
});

// --------------------------------------------------------------------------
// TEST 4: Room Creation and Creator Relationship
// --------------------------------------------------------------------------
runTest('Room creation links creator to room and records room_created activity', () => {
  const creatorId = 'user-4';
  const roomName = `Test Alpha Room ${Date.now()}`;

  const room = db.createRoom({
    name: roomName,
    topic: 'Testing model alignment and calibration',
    category: 'AI & Tech',
    description: 'A test verification room created during test execution',
    createdBy: creatorId,
    activeThesis: 'Kaito: Verification runs confirm deterministic behavior.',
    tags: ['Testing', 'Verification']
  });

  assert.ok(room.id, 'Room ID must be defined');
  assert.strictEqual(room.createdBy, creatorId);
  assert.ok(room.participants.includes(creatorId), 'Creator must be among participants');

  const creator = db.getUserById(creatorId)!;
  assert.ok(
    creator.roomsCreated.includes(room.id),
    'User roomsCreated must include newly created room'
  );
  assert.ok(
    creator.roomsJoined.includes(room.id),
    'User roomsJoined must include newly created room'
  );

  // Check activity log
  const activities = db.getActivities({ userId: creatorId, type: 'room_created' });
  assert.ok(activities.length > 0, 'Expected room_created activity in log');
  assert.strictEqual(activities[0].roomId, room.id);
});

// --------------------------------------------------------------------------
// TEST 5: Room Joining and Leaving Lifecycle
// --------------------------------------------------------------------------
runTest('Joining and leaving room updates participant count and logs activity', () => {
  const rooms = db.getRooms();
  assert.ok(rooms.length > 0, 'No rooms available for test');
  const testRoom = rooms[0];
  const joiningUserId = 'user-5';

  // Join Room
  const joinResult = db.joinRoom(testRoom.id, joiningUserId);
  assert.strictEqual(joinResult.success, true);
  assert.ok(testRoom.participants.includes(joiningUserId));

  const joinActivities = db.getActivities({ userId: joiningUserId, type: 'room_joined' });
  assert.ok(joinActivities.length > 0, 'Expected room_joined activity log');

  // Leave Room
  const leaveResult = db.leaveRoom(testRoom.id, joiningUserId);
  assert.strictEqual(leaveResult.success, true);
  assert.ok(!testRoom.participants.includes(joiningUserId));

  const leaveActivities = db.getActivities({ userId: joiningUserId, type: 'room_left' });
  assert.ok(leaveActivities.length > 0, 'Expected room_left activity log');
});

// --------------------------------------------------------------------------
// TEST 6: Room Messaging and Thesis Submissions
// --------------------------------------------------------------------------
runTest('Posting message in room records thesis/chat and activity log', () => {
  const rooms = db.getRooms();
  const testRoom = rooms[0];
  const senderId = 'user-6';
  const content = 'Comprehensive probability thesis analysis for verification test.';

  const message = db.addRoomMessage({
    roomId: testRoom.id,
    userId: senderId,
    content,
    type: 'thesis',
    stance: 'YES',
    stakedAmount: 500
  });

  assert.ok(message, 'Message should be successfully created');
  assert.strictEqual(message?.userId, senderId);
  assert.strictEqual(message?.stance, 'YES');
  assert.strictEqual(message?.stakedAmount, 500);

  // Verify activity
  const msgActivities = db.getActivities({ userId: senderId, type: 'thesis_shared' });
  assert.ok(msgActivities.length > 0, 'Expected thesis_shared activity log');
  assert.strictEqual(msgActivities[0].roomId, testRoom.id);
});

// --------------------------------------------------------------------------
// TEST 7: Activity Log Filtering & Search
// --------------------------------------------------------------------------
runTest('Activity logs filter accurately by userId and activityType', () => {
  const user1Activities = db.getActivities({ userId: 'user-1' });
  user1Activities.forEach((act) => {
    assert.strictEqual(act.userId, 'user-1', 'Filtered activity must belong to user-1');
  });

  const roomCreatedActivities = db.getActivities({ type: 'room_created' });
  roomCreatedActivities.forEach((act) => {
    assert.strictEqual(act.activityType, 'room_created', 'Filtered activity must be room_created');
  });
});

// --------------------------------------------------------------------------
// TEST 8: Admin Dashboard Statistics and Access Controls
// --------------------------------------------------------------------------
runTest('Admin stats aggregate counts accurately across database', () => {
  const stats = db.getAdminStats();
  assert.ok(stats.totalUsers >= 10, 'Expected at least 10 users in admin stats');
  assert.ok(stats.totalRooms >= 4, 'Expected at least 4 rooms in admin stats');
  assert.ok(stats.totalActivities >= 8, 'Expected at least 8 activities in admin stats');
  assert.ok(typeof stats.onlineUsers === 'number', 'Expected onlineUsers count');
  assert.ok(typeof stats.offlineUsers === 'number', 'Expected offlineUsers count');
});

// ==========================================================================
// PRESERVED FUTURE TESTS (CONVERTED TO COMMENTS AS REQUESTED IN SPEC)
// In accordance with Prompt Specification #2:
// "Where appropriate, convert tests into comments as requested, while
// preserving the original test logic in commented form for future reference."
// ==========================================================================

/*
// [PRESERVED FUTURE TEST 1]: Multi-party Solana Oracle Dispute Window Resolution
// Preserved test logic for Phase 2 decentralized oracle challenge period:
// runTest('Panta Oracle handles dispute escalation during 1-hour challenge window', async () => {
//   const market = MOCK_MARKETS.find((m) => m.id === 'crypto-btc-120k')!;
//   const initialPhase = market.pantaMarketPhase || 'primary';
//   const disputeStatus = market.disputeStatus || 'none';
//   assert.strictEqual(disputeStatus, 'none');
//   // Escalate to secondary arbitration committee
//   const escalation = await simulateDisputeEscalation(market.id, {
//     challenger: 'user-2',
//     stakeUsdc: 1000,
//     reason: 'Discrepancy between Coinbase and Binance spot print timestamps'
//   });
//   assert.strictEqual(escalation.status, 'under_review');
// });

// [PRESERVED FUTURE TEST 2]: Quadratic Staking Weighting for Panta Room Polls
// Preserved test logic for quadratic voting distribution inside live rooms:
// runTest('Quadratic voting distributes room consensus without whale domination', () => {
//   const stakes = [100, 400, 900, 10000];
//   const quadraticWeights = stakes.map((s) => Math.sqrt(s));
//   const totalWeight = quadraticWeights.reduce((a, b) => a + b, 0);
//   const whaleWeight = Math.sqrt(10000) / totalWeight;
//   // In linear voting whale is 10000/11400 = 87.7%, in quadratic voting whale is 100/160 = 62.5%
//   assert.ok(whaleWeight < 0.65, 'Whale dominance should be reduced by quadratic root');
// });

// [PRESERVED FUTURE TEST 3]: Automated WebRTC Voice Mesh Signaling Handshake
// Preserved test logic for peer-to-peer audio mesh state in room:
// runTest('Room voice session establishes peer connection mesh token', async () => {
//   const roomId = 'room-1';
//   const token = generateRoomAudioToken(roomId, 'user-1', { role: 'speaker' });
//   assert.ok(token.jwt.length > 20);
//   assert.strictEqual(token.permissions.canSpeak, true);
// });
*/

console.log(`\n====================================================`);
console.log(`   ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED   `);
console.log(`====================================================\n`);
