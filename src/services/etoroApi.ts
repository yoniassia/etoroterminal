const ETORO_API_BASE_URL = 'https://public-api.etoro.com';

export interface Position {
  positionId: number;
  instrumentId: number;
  instrumentName?: string;
  isBuy: boolean;
  amount: number;
  leverage: number;
  units: number;
  openRate: number;
  currentRate?: number;
  openDateTime: string;
  takeProfitRate?: number;
  stopLossRate?: number;
  profit?: number;
  profitPercentage?: number;
}

export interface PortfolioData {
  totalValue: number;
  equity: number;
  credit: number;
  bonusCredit: number;
  profit: number;
  positions: Position[];
}

export interface UserInfo {
  username: string;
  customerId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
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
  private isDemo: boolean = true;

  constructor(userKey: string, apiKey: string) {
    console.log('[EToroApiService] Initializing with keys:', {
      'userKey length': userKey?.length || 0,
      'userKey preview': userKey?.substring(0, 50) || 'MISSING',
      'apiKey length': apiKey?.length || 0,
      'apiKey preview': apiKey?.substring(0, 30) || 'MISSING',
    });
    this.userKey = userKey;
    this.apiKey = apiKey;
  }

  setDemoMode(isDemo: boolean): void {
    this.isDemo = isDemo;
  }

  isDemoMode(): boolean {
    return this.isDemo;
  }

  setKeys(userKey: string, apiKey: string): void {
    console.log('[EToroApiService] Updating keys');
    this.userKey = userKey;
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const requestId = generateUUID();
    const headers: Record<string, string> = {
      'x-request-id': requestId,
      'x-api-key': this.apiKey,
      'x-user-key': this.userKey,
    };

    // Only add Content-Type for non-GET requests
    if (options.method && options.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    // Merge with any additional headers
    Object.assign(headers, options.headers || {});

    const url = `${ETORO_API_BASE_URL}${endpoint}`;
    console.log(`[API Request] ${options.method || 'GET'} ${url}`);
    console.log('[Full API Headers]', headers);
    console.log('[API Keys]', {
      'x-api-key length': this.apiKey.length,
      'x-api-key first 30': this.apiKey.substring(0, 30),
      'x-user-key length': this.userKey.length,
      'x-user-key first 80': this.userKey.substring(0, 80),
    });

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      ...options,
    };

    console.log('[Fetch Options]', {
      method: fetchOptions.method,
      url,
      headersCount: Object.keys(headers).length,
    });

    const response = await fetch(url, fetchOptions);

    console.log(`[API Response] Status: ${response.status} ${response.statusText}`);
    console.log('[Response Headers]', Object.fromEntries(response.headers.entries()));

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
      const endpoint = this.isDemo 
        ? '/api/v1/trading/info/demo/portfolio' 
        : '/api/v1/trading/info/portfolio';
      console.log(`[EToroApiService] Fetching portfolio from: ${endpoint} (demo=${this.isDemo})`);
      const data = await this.makeRequest(endpoint);

      console.log('Full portfolio response:', JSON.stringify(data, null, 2));

      const clientPortfolio = data.clientPortfolio || data;
      const credit = clientPortfolio.credit || clientPortfolio.Credit || 0;
      const bonusCredit = clientPortfolio.bonusCredit || clientPortfolio.BonusCredit || 0;

      const rawPositions = clientPortfolio.positions || clientPortfolio.Positions || [];
      const positions: Position[] = rawPositions.map((p: Record<string, unknown>) => ({
        positionId: p.positionId || p.PositionID || p.positionID,
        instrumentId: p.instrumentId || p.InstrumentID || p.instrumentID,
        isBuy: p.isBuy ?? p.IsBuy ?? true,
        amount: p.amount || p.Amount || 0,
        leverage: p.leverage || p.Leverage || 1,
        units: p.units || p.Units || 0,
        openRate: p.openRate || p.OpenRate || 0,
        openDateTime: p.openDateTime || p.OpenDateTime || new Date().toISOString(),
        takeProfitRate: p.takeProfitRate || p.TakeProfitRate,
        stopLossRate: p.stopLossRate || p.StopLossRate,
      }));

      let positionsValue = 0;
      if (positions.length > 0) {
        positionsValue = positions.reduce((total: number, position: Position) => {
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
        bonusCredit,
        profit: 0,
        positions,
      };
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  async getUserInfo(): Promise<UserInfo | null> {
    try {
      // Always use REAL portfolio endpoint to get CID (works for both demo and real accounts)
      const data = await this.makeRequest('/api/v1/trading/info/portfolio');
      const clientPortfolio = data.clientPortfolio || data;
      const rawPositions = clientPortfolio.positions || [];
      
      let numericCID: number | undefined;
      
      if (rawPositions.length > 0) {
        numericCID = rawPositions[0].CID;
      }
      
      if (numericCID) {
        // Try to fetch user info using the numeric CID from REAL user-info endpoint
        try {
          const userInfoData = await this.makeRequest(`/api/v1/user-info/people?cidList=${numericCID}`);
          const users = userInfoData.users || [];
          if (users.length > 0) {
            const user = users[0];
            const firstName = user.firstName || user.first_name;
            const lastName = user.lastName || user.last_name;
            // fullName available if needed: [firstName, lastName].filter(Boolean).join(' ')
            
            return {
              username: user.username || user.userName || '',
              customerId: String(numericCID),
              firstName: firstName,
              lastName: lastName,
              email: user.email,
            };
          }
        } catch (userInfoError) {
          console.log('[EToroApiService] Could not fetch user info from real endpoint');
        }
        
        // Fallback: use numeric CID
        return {
          username: '',
          customerId: String(numericCID),
          firstName: undefined,
          lastName: undefined,
          email: undefined,
        };
      }
      
      // Fallback to decoding user key
      const decoded = this.decodeUserKey();
      if (decoded) {
        return {
          username: '',
          customerId: decoded.ci || '',
          firstName: undefined,
          lastName: undefined,
          email: undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  private decodeUserKey(): { ci?: string; ean?: string; ek?: string } | null {
    try {
      if (!this.userKey) return null;
      // Remove trailing underscores and convert URL-safe base64 to standard base64
      const base64 = this.userKey
        .replace(/__$/, '')
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const decoded = atob(base64);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

// Create singleton instance with environment variables
export const etoroApi = new EToroApiService(
  '', // User key - must be set via setKeys()
  import.meta.env.VITE_ETORO_PUBLIC_KEY || '' // Public key from env
);
