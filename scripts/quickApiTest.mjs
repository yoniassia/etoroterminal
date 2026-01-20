/**
 * Quick API Test - Tests eToro Public API endpoints
 * Usage: node scripts/quickApiTest.mjs <publicKey> <userKey>
 */

const API_BASE = 'https://public-api.etoro.com';

const publicKey = process.argv[2];
const userKey = process.argv[3];

if (!publicKey || !userKey) {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  eToro Terminal - Quick API Test                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Usage: node scripts/quickApiTest.mjs <publicKey> <userKey>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/quickApiTest.mjs pk_abc123 uk_xyz789');
  console.log('');
  process.exit(1);
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testEndpoint(name, path, method = 'GET') {
  const url = `${API_BASE}${path}`;
  const start = Date.now();
  
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'x-api-key': publicKey,
        'x-user-key': userKey,
        'x-request-id': uuid(),
      },
    });
    
    const latency = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    
    if (res.ok) {
      const count = Array.isArray(data) ? data.length : 
                    data.items?.length ?? data.data?.length ?? '?';
      console.log(`✓ ${name.padEnd(20)} ${res.status} (${latency}ms) [${count} items]`);
      return { status: 'PASS', data };
    } else {
      console.log(`✗ ${name.padEnd(20)} ${res.status} - ${data.errorMessage || data.message || res.statusText}`);
      return { status: 'FAIL', code: res.status, error: data.errorMessage };
    }
  } catch (err) {
    console.log(`✗ ${name.padEnd(20)} ERROR - ${err.message}`);
    return { status: 'FAIL', error: err.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  eToro Terminal - API Integration Test                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Public Key: ${publicKey.substring(0, 8)}...`);
  console.log(`User Key: ${userKey.substring(0, 8)}...`);
  console.log('');
  console.log('═'.repeat(64));
  console.log('ENDPOINT TESTS');
  console.log('═'.repeat(64));
  
  const results = [];
  
  // Core endpoints (updated based on eToro API docs)
  results.push({ name: 'User Info', ...await testEndpoint('User Info', '/api/v1/user-info/people') });
  results.push({ name: 'Market Data Search', ...await testEndpoint('Market Data Search', '/api/v1/market-data/search') });
  results.push({ name: 'Exchanges', ...await testEndpoint('Exchanges', '/api/v1/market-data/exchanges') });
  results.push({ name: 'Watchlists', ...await testEndpoint('Watchlists', '/api/v1/watchlists') });
  results.push({ name: 'Curated Lists', ...await testEndpoint('Curated Lists', '/api/v1/curated-lists') });
  results.push({ name: 'Recommendations', ...await testEndpoint('Recommendations', '/api/v1/market-recommendations/10') });
  results.push({ name: 'User Search', ...await testEndpoint('User Search', '/api/v1/user-info/people/search?period=LastYear') });
  results.push({ name: 'PI Copiers', ...await testEndpoint('PI Copiers', '/api/v1/pi-data/copiers') });
  
  // Portfolio endpoints
  results.push({ name: 'Demo Portfolio', ...await testEndpoint('Demo Portfolio', '/api/v1/trading/info/demo/portfolio') });
  results.push({ name: 'Demo PnL', ...await testEndpoint('Demo PnL', '/api/v1/trading/info/demo/pnl') });
  results.push({ name: 'Real Portfolio', ...await testEndpoint('Real Portfolio', '/api/v1/trading/info/portfolio') });
  
  // Summary
  console.log('');
  console.log('═'.repeat(64));
  console.log('SUMMARY');
  console.log('═'.repeat(64));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`  PASSED: ${passed}/${results.length}`);
  console.log(`  FAILED: ${failed}/${results.length}`);
  console.log('');
  
  if (passed === results.length) {
    console.log('🎉 All API tests passed! Terminal is ready to use.');
  } else if (passed > 0) {
    console.log('⚠️  Some endpoints failed. Check API key permissions.');
  } else {
    console.log('❌ All tests failed. Verify your API keys are correct.');
  }
  
  // Panel readiness
  console.log('');
  console.log('═'.repeat(64));
  console.log('PANEL READINESS');
  console.log('═'.repeat(64));
  
  const panelMap = {
    'User Info': 'LOGIN',
    'Market Data Search': 'QT, CH, TRD',
    'Exchanges': 'Market Data',
    'Watchlists': 'WL, WLM',
    'Curated Lists': 'CUR',
    'Recommendations': 'REC',
    'User Search': 'PI, PIP',
    'PI Copiers': 'PI Data',
    'Demo Portfolio': 'PF (Demo)',
    'Demo PnL': 'PF (Demo)',
    'Real Portfolio': 'PF (Real)',
  };
  
  for (const r of results) {
    const panels = panelMap[r.name] || r.name;
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${panels.padEnd(15)} ${r.status === 'PASS' ? 'Ready' : 'Unavailable'}`);
  }
}

main().catch(console.error);
