// Test demo user key with eToro API
// Public key is included, replace USER_KEY with your own
const API_KEY = process.env.VITE_ETORO_PUBLIC_KEY || 'sdgdskldFPLGfjHn1421dgnlxdGTbngdflg6290bRjslfihsjhSDsdgGHH25hjf';
const USER_KEY = process.env.VITE_ETORO_USER_KEY || '';

async function testDemoAPI() {
  if (!USER_KEY) {
    console.error('❌ Missing USER_KEY. Please set VITE_ETORO_USER_KEY environment variable.');
    process.exit(1);
  }
  if (!API_KEY) {
    console.error('❌ Missing API_KEY. Public key should be set by default.');
    process.exit(1);
  }

  console.log('Testing Demo User Key with eToro API...');
  console.log('Public Key length:', API_KEY.length);
  console.log('User Key length:', USER_KEY.length);
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
