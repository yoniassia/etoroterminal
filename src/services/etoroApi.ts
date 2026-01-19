const ETORO_API_BASE_URL = 'https://public-api.etoro.com';

interface PortfolioData {
  totalValue: number;
  equity: number;
  credit: number;
  profit: number;
}

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class EToroApiService {
  private userKey: string;
  private apiKey: string;

  constructor(userKey: string, apiKey: string) {
    this.userKey = userKey;
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const requestId = generateUUID();
    const headers = {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      'x-api-key': this.apiKey,
      'x-user-key': this.userKey,
      ...options.headers,
    };

    const url = `${ETORO_API_BASE_URL}${endpoint}`;
    console.log(`[API Request] ${url}`);
    console.log('[API Headers]', {
      'x-request-id': requestId,
      'x-api-key': this.apiKey.substring(0, 20) + '...',
      'x-user-key': this.userKey.substring(0, 50) + '...'
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[API Response] Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Error Response]', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[API Response Data]', data);
    return data;
  }

  async getPortfolio(): Promise<PortfolioData> {
    try {
      // Try real account first, then demo if it fails
      let data;
      try {
        console.log('Trying real account endpoint: /api/v1/trading/info/portfolio');
        data = await this.makeRequest('/api/v1/trading/info/portfolio');
      } catch (error) {
        console.log('Real account failed, trying demo account: /api/v1/trading/info/demo/portfolio');
        data = await this.makeRequest('/api/v1/trading/info/demo/portfolio');
      }

      console.log('Full portfolio response:', JSON.stringify(data, null, 2));

      // Extract data from the actual API response structure
      const clientPortfolio = data.clientPortfolio || data;
      const credit = clientPortfolio.credit || 0;
      const bonusCredit = clientPortfolio.bonusCredit || 0;

      // Calculate total value from positions
      let positionsValue = 0;
      if (clientPortfolio.positions && Array.isArray(clientPortfolio.positions)) {
        positionsValue = clientPortfolio.positions.reduce((total: number, position: any) => {
          return total + (position.amount || 0);
        }, 0);
      }

      const totalValue = credit + bonusCredit + positionsValue;

      console.log('Calculated values:', {
        credit,
        bonusCredit,
        positionsValue,
        totalValue
      });

      return {
        totalValue,
        equity: positionsValue,
        credit,
        profit: 0, // Would need PnL endpoint for actual profit
      };
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  async getAccountInfo() {
    try {
      return await this.makeRequest('/api/v1/user-info/people');
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }
}

// Create singleton instance with environment variables
export const etoroApi = new EToroApiService(
  import.meta.env.VITE_ETORO_USER_KEY || '',
  import.meta.env.VITE_ETORO_PUBLIC_KEY || ''
);
