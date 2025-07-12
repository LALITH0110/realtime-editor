// This simulates what happens when a user logs in and tries to join a room

async function testUIFlow() {
  console.log('=== Testing UI Flow ===');
  
  // Simulate user login
  const timestamp = Date.now();
  const username = `uiuser${timestamp}`;
  
  console.log('\n1. Simulating user login...');
  const loginResponse = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      email: `${username}@test.com`,
      password: 'password123'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('Login failed:', await loginResponse.text());
    return;
  }
  
  const authData = await loginResponse.json();
  console.log('✅ User logged in:', authData.username);
  
  // Store token in localStorage (simulating what the UI would do)
  const token = authData.token;
  console.log('Token:', token.substring(0, 20) + '...');
  
  // Create a room
  console.log('\n2. Creating password-protected room...');
  const roomResponse = await fetch('http://localhost:3000/api/rooms', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'UI Test Room',
      passwordProtected: true,
      password: 'uitest123'
    })
  });
  
  if (!roomResponse.ok) {
    console.error('Room creation failed:', await roomResponse.text());
    return;
  }
  
  const room = await roomResponse.json();
  console.log('✅ Room created:', room.name, 'Key:', room.roomKey);
  
  // Test the auth service join flow (simulating what the UI does)
  console.log('\n3. Testing auth service join flow...');
  
  // First, test the access endpoint
  console.log('3a. Testing access endpoint...');
  const accessResponse = await fetch(`http://localhost:3000/api/rooms/access/${room.roomKey}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (accessResponse.ok) {
    const accessRoom = await accessResponse.json();
    console.log('✅ Access endpoint works:', accessRoom.name);
  } else {
    console.log('❌ Access endpoint failed:', accessResponse.status);
    
    // If access fails, try the join endpoint
    console.log('3b. Testing join endpoint...');
    const joinResponse = await fetch('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        roomKey: room.roomKey,
        userId: authData.userId
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
  }
  
  console.log('\n4. Summary:');
  console.log(`- User: ${authData.username}`);
  console.log(`- Room: ${room.name} (${room.roomKey})`);
  console.log(`- Password Protected: ${room.isPasswordProtected}`);
  console.log(`- Token: ${token.substring(0, 20)}...`);
}

testUIFlow().catch(console.error);
