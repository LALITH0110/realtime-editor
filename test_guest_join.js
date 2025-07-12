const BASE_URL = 'http://localhost:8080';

async function testGuestJoin() {
  console.log('=== Testing Guest User Join ===');
  
  // First, let's create a room with a password using an authenticated user
  console.log('\n1. Creating authenticated user...');
  const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'creator',
      email: 'creator@test.com',
      password: 'password123'
    })
  });
  
  if (!signupResponse.ok) {
    console.error('Signup failed:', await signupResponse.text());
    return;
  }
  
  const authData = await signupResponse.json();
  console.log('✅ User created:', authData.username);
  
  // Create a password-protected room
  console.log('\n2. Creating password-protected room...');
  const roomResponse = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      name: 'Guest Test Room',
      passwordProtected: true,
      password: 'guest123'
    })
  });
  
  if (!roomResponse.ok) {
    console.error('Room creation failed:', await roomResponse.text());
    return;
  }
  
  const room = await roomResponse.json();
  console.log('✅ Room created:', room.name, 'Key:', room.roomKey);
  
  // Now test guest join without password (should fail)
  console.log('\n3. Testing guest join without password (should fail)...');
  try {
    const guestJoinResponse = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomKey: room.roomKey,
        username: 'GuestUser'
      })
    });
    
    if (guestJoinResponse.ok) {
      console.log('❌ Guest join without password should have failed!');
    } else {
      console.log('✅ Guest join without password correctly failed');
      console.log('Response status:', guestJoinResponse.status);
      const errorText = await guestJoinResponse.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error during guest join without password:', error);
  }
  
  // Test guest join with correct password (should succeed)
  console.log('\n4. Testing guest join with correct password (should succeed)...');
  try {
    const guestJoinResponse = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomKey: room.roomKey,
        password: 'guest123',
        username: 'GuestUser'
      })
    });
    
    if (guestJoinResponse.ok) {
      const joinedRoom = await guestJoinResponse.json();
      console.log('✅ Guest join with password succeeded!');
      console.log('Joined room:', joinedRoom.name);
    } else {
      console.log('❌ Guest join with password failed');
      console.log('Response status:', guestJoinResponse.status);
      const errorText = await guestJoinResponse.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error during guest join with password:', error);
  }
  
  // Test guest join with wrong password (should fail)
  console.log('\n5. Testing guest join with wrong password (should fail)...');
  try {
    const guestJoinResponse = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomKey: room.roomKey,
        password: 'wrongpassword',
        username: 'GuestUser'
      })
    });
    
    if (guestJoinResponse.ok) {
      console.log('❌ Guest join with wrong password should have failed!');
    } else {
      console.log('✅ Guest join with wrong password correctly failed');
      console.log('Response status:', guestJoinResponse.status);
      const errorText = await guestJoinResponse.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error during guest join with wrong password:', error);
  }
}

testGuestJoin().catch(console.error);
