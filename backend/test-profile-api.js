// Test script for profile API
const API_BASE = 'http://localhost:5000/api';

async function testProfileAPI() {
  console.log('🧪 Testing Profile API...\n');

  // Step 1: Login to get token
  console.log('Step 1: Logging in...');
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@test.com',
      password: 'password'
    })
  });

  const loginData = await loginResponse.json();

  if (!loginData.success) {
    console.log('❌ Login failed, trying different password...');

    // Try without password or default
    const loginResponse2 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test'
      })
    });

    const loginData2 = await loginResponse2.json();
    if (!loginData2.success) {
      console.log('❌ Cannot login. Please provide the correct password for test@test.com');
      console.log('Response:', loginData2);
      return;
    }

    var token = loginData2.token;
  } else {
    var token = loginData.token;
  }

  console.log('✅ Login successful');
  console.log('Token:', token.substring(0, 20) + '...\n');

  // Step 2: Get Profile
  console.log('Step 2: Getting profile...');
  const profileResponse = await fetch(`${API_BASE}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const profileData = await profileResponse.json();

  if (profileResponse.ok) {
    console.log('✅ Profile fetched successfully:');
    console.log(JSON.stringify(profileData, null, 2));
  } else {
    console.log('❌ Failed to fetch profile:');
    console.log(JSON.stringify(profileData, null, 2));
  }

  console.log('\n✅ Backend API test complete!');
}

testProfileAPI().catch(console.error);
