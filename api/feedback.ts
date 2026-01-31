/**
 * Feedback API Endpoint
 * Receives feedback from the eToro Terminal
 */

// In-memory storage for demo (use a database in production)
// Feedback is also stored client-side in localStorage
const feedbackStore: any[] = [];

export default async function handler(
  req: { method: string; body: any; headers: Record<string, string | string[] | undefined> },
  res: { 
    setHeader: (name: string, value: string) => void; 
    status: (code: number) => { json: (data: any) => void; end: () => void } 
  }
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Receive new feedback
      const feedback = req.body;
      
      if (!feedback || !feedback.id || !feedback.title) {
        return res.status(400).json({ 
          error: 'Invalid feedback payload' 
        });
      }

      // Store feedback
      feedbackStore.push({
        ...feedback,
        receivedAt: new Date().toISOString(),
        serverProcessed: true,
      });

      console.log('[Feedback API] Received:', feedback.id, feedback.title);

      // Log for agent analysis (this could be sent to a webhook or stored in a database)
      const logEntry = `[${new Date().toISOString()}] FEEDBACK: ${feedback.type} | ${feedback.title} | ${feedback.category || 'N/A'} | Rating: ${feedback.rating || 'N/A'} | Source: ${feedback.source}`;
      console.log(logEntry);

      return res.status(200).json({ 
        success: true, 
        id: feedback.id,
        message: 'Feedback received successfully'
      });

    } else if (req.method === 'GET') {
      // Return all feedback (for agent analysis)
      // In production, add authentication here
      const authHeader = req.headers.authorization;
      
      // Simple auth check (use proper auth in production)
      if (authHeader !== `Bearer ${process.env.FEEDBACK_API_SECRET}`) {
        // Return summary without auth for public access
        return res.status(200).json({
          count: feedbackStore.length,
          message: 'Authentication required for full feedback data',
          summary: {
            byType: feedbackStore.reduce((acc, f) => {
              acc[f.type] = (acc[f.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          }
        });
      }

      return res.status(200).json({
        count: feedbackStore.length,
        feedback: feedbackStore,
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}
