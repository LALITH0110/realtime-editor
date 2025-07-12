async function testRoomResponse() {
  console.log('=== Testing Room Response Fields ===');
  
  const timestamp = Date.now();
  const username = `fieldtest${timestamp}`;
  
  console.log('\n1. Creating user...');
  const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      email: `${username}@test.com`,
      password: 'password123'
    })
  });
  
  const authData = await signupResponse.json();
  console.log('✅ User created:', authData.username);
  
  console.log('\n2. Creating password-protected room...');
  const roomResponse = await fetch('http://localhost:3000/api/rooms', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      name: 'Field Test Room',
      passwordProtected: true,
      password: 'fieldtest123'
    })
  });
  
  const room = await roomResponse.json();
  console.log('✅ Room created. Full response:');
  console.log(JSON.stringify(room, null, 2));
  
  console.log('\n3. Getting room by key...');
  const keyResponse = await fetch(`http://localhost:3000/api/rooms/key/${room.roomKey}`);
  const keyRoom = await keyResponse.json();
  console.log('✅ Room by key. Full response:');
  console.log(JSON.stringify(keyRoom, null, 2));
  
  console.log('\n4. Getting user rooms...');
  const userRoomsResponse = await fetch('http://localhost:3000/api/user/rooms', {
    headers: { 
      'Authorization': `Bearer ${authData.token}`
    }
  });
  const userRooms = await userRoomsResponse.json();
  console.log('✅ User rooms. Full response:');
  console.log(JSON.stringify(userRooms, null, 2));
  
  console.log('\n5. Field analysis:');
  console.log(`- room.isPasswordProtected: ${room.isPasswordProtected}`);
  console.log(`- room.passwordProtected: ${room.passwordProtected}`);
  console.log(`- keyRoom.isPasswordProtected: ${keyRoom.isPasswordProtected}`);
  console.log(`- keyRoom.passwordProtected: ${keyRoom.passwordProtected}`);
  if (userRooms.length > 0) {
    console.log(`- userRooms[0].isPasswordProtected: ${userRooms[0].isPasswordProtected}`);
    console.log(`- userRooms[0].passwordProtected: ${userRooms[0].passwordProtected}`);
  }
}

testRoomResponse().catch(console.error);
