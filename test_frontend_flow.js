const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8080';

async function testFrontendFlow() {
  console.log('=== Testing Frontend Flow ===');
  
  // First, create a user and room directly via backend
  const timestamp = Date.now();
  const username = `frontendtest${timestamp}`;
  
  console.log('\n1. Creating user and room via backend...');
  const signupResponse = await fetch(`${BACKEND_URL}/api/auth/signup`, {
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
  
  const roomResponse = await fetch(`${BACKEND_URL}/api/rooms`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      name: 'Frontend Test Room',
      passwordProtected: true,
      password: 'frontend123'
    })
  });
  
  if (!roomResponse.ok) {
    console.error('Room creation failed:', await roomResponse.text());
    return;
  }
  
  const room = await roomResponse.json();
  console.log('✅ Room created:', room.name, 'Key:', room.roomKey);
  
  // Test frontend join API with authentication
  console.log('\n2. Testing frontend join API with authentication...');
  const frontendJoinResponse = await fetch(`${BASE_URL}/api/rooms/join`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      roomKey: room.roomKey
    })
  });
  
  if (frontendJoinResponse.ok) {
    const joinRoom = await frontendJoinResponse.json();
    console.log('✅ Frontend join API works:', joinRoom.name);
  } else {
    console.log('❌ Frontend join API failed:', frontendJoinResponse.status);
    const errorText = await frontendJoinResponse.text();
    console.log('Error response:', errorText);
  }
  
  // Test frontend access API
  console.log('\n3. Testing frontend access API...');
  const frontendAccessResponse = await fetch(`${BASE_URL}/api/rooms/access/${room.roomKey}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${authData.token}`
    }
  });
  
  if (frontendAccessResponse.ok) {
    const accessRoom = await frontendAccessResponse.json();
    console.log('✅ Frontend access API works:', accessRoom.name);
  } else {
    console.log('❌ Frontend access API failed:', frontendAccessResponse.status);
    const errorText = await frontendAccessResponse.text();
    console.log('Error response:', errorText);
  }
  
  // Test guest join through frontend (should fail)
  console.log('\n4. Testing guest join through frontend...');
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
    console.log('❌ Guest join should have failed!');
  } else {
    console.log('✅ Guest join correctly failed');
    console.log('Response status:', guestJoinResponse.status);
  }
  
  // Test guest join with password through frontend (should work)
  console.log('\n5. Testing guest join with password through frontend...');
  const guestPasswordJoinResponse = await fetch(`${BASE_URL}/api/rooms/join`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      roomKey: room.roomKey,
      username: 'GuestUser',
      password: 'frontend123'
    })
  });
  
  if (guestPasswordJoinResponse.ok) {
    const joinRoom = await guestPasswordJoinResponse.json();
    console.log('✅ Guest join with password works:', joinRoom.name);
  } else {
    console.log('❌ Guest join with password failed:', guestPasswordJoinResponse.status);
    const errorText = await guestPasswordJoinResponse.text();
    console.log('Error response:', errorText);
  }
}

testFrontendFlow().catch(console.error);
