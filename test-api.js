// Test new demo user key with eToro API
const USER_KEY = 'eyJjaSI6IjYwY2FiYjBiLTU1OTctNDQ4NS04ZjYzLTdlOWUwNTZlMGJiOCIsImVhbiI6IlVucmVnaXN0ZXJlZEFwcGxpY2F0aW9uIiwiZWsiOiJVSy1OSDY3R2xXVC5vRTBUR3JzcXJ0VFJ3TnJ4RzRpMzEwU3VHT25LME4xMHNvaDBXczY2eGtGYWd3MWJyYlJ1RG5ZeEM0b0l0c2xhWDNsZGR1ajhYTHpneFpuREo3QjRzdHAyRnZCQ0Nhc18ifQ__';
const API_KEY = 'sdgdskldFPLGfjHn1421dgnlxdGTbngdflg6290bRjslfihsjhSDsdgGHH25hjf';

async function testDemoAPI() {
  console.log('Testing NEW Demo User Key with eToro API...');
  console.log('User Key length:', USER_KEY.length);
  console.log('API Key length:', API_KEY.length);
  console.log('User Key preview:', USER_KEY.substring(0, 80));
  console.log('');

  const headers = {
    'x-request-id': crypto.randomUUID(),
    'x-api-key': API_KEY,
    'x-user-key': USER_KEY,
  };

  try {
    console.log('Calling DEMO endpoint: https://public-api.etoro.com/api/v1/trading/info/demo/portfolio');
    const response = await fetch('https://public-api.etoro.com/api/v1/trading/info/demo/portfolio', {
      method: 'GET',
      headers,
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const text = await response.text();

    if (response.ok) {
      console.log('✅ SUCCESS! Demo API works with new key!');
      const data = JSON.parse(text);
      console.log('Portfolio data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED with status:', response.status);
      console.log('Error response:', text);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDemoAPI();
