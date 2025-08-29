const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:4000/api';

async function testArrivalAPI() {
  console.log('🧪 Testing Arrival API...\n');

  try {
    // Test 1: Get all arrivals
    console.log('1. Testing GET /api/arrivals');
    const response1 = await fetch(`${API_BASE_URL}/arrivals`);
    const data1 = await response1.json();
    console.log('✅ Response:', data1);
    console.log('');

    // Test 2: Record a new arrival
    console.log('2. Testing POST /api/arrivals');
    const arrivalData = {
      routeId: 'vv1',
      busNumber: 'AP16AB1234',
      stopName: 'Kankipadu',
      scheduledTime: '10:30 AM',
      actualTime: '10:35 AM',
      location: {
        lat: 16.5062,
        lng: 80.6480
      },
      occupancy: 'medium',
      passengerCount: 25,
      driverNotes: 'Test arrival',
      weather: 'clear',
      trafficCondition: 'moderate'
    };

    const response2 = await fetch(`${API_BASE_URL}/arrivals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arrivalData),
    });

    const data2 = await response2.json();
    console.log('✅ Response:', data2);
    console.log('');

    // Test 3: Get arrivals for VV1 route
    console.log('3. Testing GET /api/arrivals/route/vv1');
    const response3 = await fetch(`${API_BASE_URL}/arrivals/route/vv1`);
    const data3 = await response3.json();
    console.log('✅ Response:', data3);
    console.log('');

    // Test 4: Get today's arrivals
    console.log('4. Testing GET /api/arrivals/route/vv1/today');
    const response4 = await fetch(`${API_BASE_URL}/arrivals/route/vv1/today`);
    const data4 = await response4.json();
    console.log('✅ Response:', data4);
    console.log('');

    // Test 5: Get arrival stats
    console.log('5. Testing GET /api/arrivals/route/vv1/stats');
    const response5 = await fetch(`${API_BASE_URL}/arrivals/route/vv1/stats`);
    const data5 = await response5.json();
    console.log('✅ Response:', data5);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Run the test
testArrivalAPI();






