const BASE_URL = 'http://localhost:8080';

async function testAuthenticatedJoin() {
  console.log('=== Testing Authenticated User Join ===');
  
  // Create a user and get their token
  const timestamp = Date.now();
  const username = `testuser${timestamp}`;
  
  console.log('\n1. Creating authenticated user...');
  const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      email: `${username}@test.com`,
      password: 'password123'
    })
  });
  
  if (!signupResponse.ok) {
    console.error('Signup failed:', await signupResponse.text());
    return;
  }
  
  const authData = await signupResponse.json();
  console.log('✅ User created:', authData.username);
  console.log('Token:', authData.token.substring(0, 20) + '...');
  
  // Create a password-protected room
  console.log('\n2. Creating password-protected room...');
  const roomResponse = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      name: 'Auth Test Room',
      passwordProtected: true,
      password: 'authtest123'
    })
  });
  
  if (!roomResponse.ok) {
    console.error('Room creation failed:', await roomResponse.text());
    return;
  }
  
  const room = await roomResponse.json();
  console.log('✅ Room created:', room.name, 'Key:', room.roomKey);
  
  // Test access endpoint (should work for creator)
  console.log('\n3. Testing access endpoint for creator...');
  const accessResponse = await fetch(`${BASE_URL}/api/rooms/access/${room.roomKey}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${authData.token}`
    }
  });
  
  if (accessResponse.ok) {
    const accessRoom = await accessResponse.json();
    console.log('✅ Access endpoint works:', accessRoom.name);
  } else {
    console.log('❌ Access endpoint failed:', accessResponse.status);
    const errorText = await accessResponse.text();
    console.log('Error response:', errorText);
  }
  
  // Test join endpoint with authentication (should work for creator)
  console.log('\n4. Testing join endpoint with authentication...');
  const joinResponse = await fetch(`${BASE_URL}/api/rooms/join`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      roomKey: room.roomKey
    })
  });
  
  if (joinResponse.ok) {
    const joinRoom = await joinResponse.json();
    console.log('✅ Join endpoint works:', joinRoom.name);
  } else {
    console.log('❌ Join endpoint failed:', joinResponse.status);
    const errorText = await joinResponse.text();
    console.log('Error response:', errorText);
  }
  
  // Test join endpoint without authentication (should fail without password)
  console.log('\n5. Testing join endpoint without authentication...');
  const guestJoinResponse = await fetch(`${BASE_URL}/api/rooms/join`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
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
  }
}

testAuthenticatedJoin().catch(console.error);
