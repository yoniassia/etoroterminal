/**
 * eToro Terminal - API Integration Test Script
 * 
 * This script tests all API endpoints used by the terminal panels.
 * Run with: npx ts-node scripts/apiTest.ts
 * 
 * Requires environment variables:
 *   ETORO_API_KEY - Your eToro Public API Key
 *   ETORO_USER_KEY - Your eToro User Key
 */

const API_BASE = 'https://public-api.etoro.com';

interface TestResult {
  endpoint: string;
  method: string;
  panel: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  latency?: number;
  error?: string;
  data?: unknown;
}

const results: TestResult[] = [];

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testEndpoint(
  endpoint: string,
  method: string,
  panel: string,
  body?: object
): Promise<TestResult> {
  const apiKey = process.env.ETORO_API_KEY;
  const userKey = process.env.ETORO_USER_KEY;

  if (!apiKey || !userKey) {
    return {
      endpoint,
      method,
      panel,
      status: 'SKIP',
      error: 'Missing API keys in environment',
    };
  }

  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'x-user-key': userKey,
    'x-request-id': generateUUID(),
  };

  if (method !== 'GET' && body) {
    headers['Content-Type'] = 'application/json';
  }

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const latency = Date.now() - startTime;
    const data = await response.json().catch(() => null);

    if (response.ok) {
      return {
        endpoint,
        method,
        panel,
        status: 'PASS',
        statusCode: response.status,
        latency,
        data,
      };
    } else {
      return {
        endpoint,
        method,
        panel,
        status: 'FAIL',
        statusCode: response.status,
        latency,
        error: data?.errorMessage || data?.message || response.statusText,
      };
    }
  } catch (err) {
    return {
      endpoint,
      method,
      panel,
      status: 'FAIL',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         eToro Terminal - API Integration Tests             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Define all endpoints to test
  const tests = [
    // Connection Status Panel (STATUS)
    { endpoint: '/api/v1/market-data/exchanges', method: 'GET', panel: 'STATUS' },
    
    // Watchlists Panel (WL)
    { endpoint: '/api/v1/watchlists', method: 'GET', panel: 'WL' },
    
    // Curated Lists Panel (CUR)
    { endpoint: '/api/v1/curated-lists', method: 'GET', panel: 'CUR' },
    
    // Recommendations Panel (REC)
    { endpoint: '/api/v1/recommendations', method: 'GET', panel: 'REC' },
    
    // Portfolio Panel (PF) - Demo
    { endpoint: '/api/v1/trading/info/demo/pnl', method: 'GET', panel: 'PF (Demo)' },
    
    // Portfolio Panel (PF) - Real
    { endpoint: '/api/v1/trading/info/real/pnl', method: 'GET', panel: 'PF (Real)' },
    
    // Quote Panel (QT) - Instruments List
    { endpoint: '/api/v1/instruments', method: 'GET', panel: 'QT' },
    
    // Trader Search Panel (PI)
    { endpoint: '/api/v1/traders/search', method: 'GET', panel: 'PI' },
    
    // User Info
    { endpoint: '/api/v1/user-info/people', method: 'GET', panel: 'Login' },
  ];

  console.log(`Running ${tests.length} API tests...\n`);

  for (const test of tests) {
    process.stdout.write(`Testing ${test.panel.padEnd(12)} ${test.endpoint}... `);
    const result = await testEndpoint(test.endpoint, test.method, test.panel);
    results.push(result);

    if (result.status === 'PASS') {
      console.log(`✓ PASS (${result.latency}ms)`);
    } else if (result.status === 'SKIP') {
      console.log(`○ SKIP - ${result.error}`);
    } else {
      console.log(`✗ FAIL - ${result.statusCode} ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(64));
  console.log('SUMMARY');
  console.log('═'.repeat(64));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`  PASSED:  ${passed}`);
  console.log(`  FAILED:  ${failed}`);
  console.log(`  SKIPPED: ${skipped}`);
  console.log('');

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.panel}: ${r.endpoint} → ${r.statusCode} ${r.error}`);
    });
  }

  // Panel readiness matrix
  console.log('\n' + '═'.repeat(64));
  console.log('PANEL READINESS');
  console.log('═'.repeat(64));

  const panelStatus: Record<string, string> = {};
  for (const r of results) {
    const panel = r.panel.replace(' (Demo)', '').replace(' (Real)', '');
    if (!panelStatus[panel] || panelStatus[panel] === 'PASS') {
      panelStatus[panel] = r.status;
    }
  }

  Object.entries(panelStatus).forEach(([panel, status]) => {
    const icon = status === 'PASS' ? '✓' : status === 'SKIP' ? '○' : '✗';
    console.log(`  ${icon} ${panel}`);
  });

  return { passed, failed, skipped, results };
}

// Run tests
runAllTests().then(summary => {
  process.exit(summary.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
