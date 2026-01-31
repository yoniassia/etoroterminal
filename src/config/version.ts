// Application version - update this when releasing new versions
export const APP_VERSION = '1.7.0';

// Build info
export const BUILD_DATE = '2026-01-31';

// Changelog
export const CHANGELOG = `
v1.7.0 (2026-01-31) - Financial Datasets Integration
- NEW: NEWS Panel - Real-time company news with sentiment
- NEW: INST Panel - Institutional ownership (13F whale tracking)
- NEW: FILINGS Panel - SEC 10-K, 10-Q, 8-K browser
- Commands: NEWS, HEADLINES, INST, WHALES, 13F, FILINGS, SEC, 10K, 10Q, 8K
- Fixed: API trailing slash bug for better reliability
- Integrated Financial Datasets API for premium data

v1.6.5 (2026-01-31)
- NEW: WEBHOOK Panel - Webhook Alerts
- Commands: WEBHOOK, HOOKS, NOTIFY, ALERTS
- Discord, Slack, Telegram integration
- Configure alerts for price, positions, P&L

v1.6.4 (2026-01-31)
- NEW: CORR Panel - Correlation Matrix
- Diversification score + visual heatmap

v1.6.3 (2026-01-31)
- NEW: JOURNAL Panel - Trade Journal
- Track emotions, setups, lessons learned

v1.6.2 (2026-01-31)
- NEW: EXPORT Panel - Data Export (JSON/CSV)

v1.6.1 (2026-01-31)
- NEW: PS Panel - Position Sizing Calculator

v1.6.0 (2026-01-31)
- Demo Mode + Health/Export APIs

v1.5.0 (2026-01-31)
- Strategy Builder Panel with AI integration
- Pre-built strategy templates

v1.4.0 (2026-01-31)
- Feedback Panel with X/Twitter posting
- Bug/feature/improvement submission

v1.3.0 (2026-01-31)
- Quant Chat Panel with OpenAI integration
- Natural language trading queries

v1.2.0 (2026-01-30)
- Initial public release
- 18 Bloomberg-style panels
- 10,800+ instruments
`;

// Parse changelog for programmatic access
export interface ChangelogEntry {
  version: string;
  date: string;
  title?: string;
  changes: string[];
}

export function parseChangelog(): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = CHANGELOG.trim().split('\n');
  let currentEntry: ChangelogEntry | null = null;

  for (const line of lines) {
    const versionMatch = line.match(/^v(\d+\.\d+\.\d+)\s+\(([^)]+)\)(?:\s*-\s*(.+))?$/);
    if (versionMatch) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2],
        title: versionMatch[3],
        changes: [],
      };
    } else if (currentEntry && line.startsWith('- ')) {
      currentEntry.changes.push(line.substring(2));
    }
  }
  if (currentEntry) entries.push(currentEntry);

  return entries;
}
