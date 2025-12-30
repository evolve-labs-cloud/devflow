import { NextRequest, NextResponse } from 'next/server';
import { ptyManager } from '@/lib/ptyManager';

// POST - Create session or write data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, data, cwd, cols, rows } = body;

    switch (action) {
      case 'create': {
        if (!sessionId || !cwd) {
          return NextResponse.json(
            { error: 'sessionId and cwd are required' },
            { status: 400 }
          );
        }

        // Check if session already exists
        const existing = ptyManager.getSession(sessionId);
        if (existing) {
          return NextResponse.json({
            success: true,
            sessionId,
            message: 'Session already exists'
          });
        }

        ptyManager.createSession(sessionId, cwd, cols || 80, rows || 24);
        return NextResponse.json({
          success: true,
          sessionId,
          message: 'Session created'
        });
      }

      case 'write': {
        if (!sessionId || data === undefined) {
          return NextResponse.json(
            { error: 'sessionId and data are required' },
            { status: 400 }
          );
        }

        const success = ptyManager.write(sessionId, data);
        if (!success) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true });
      }

      case 'resize': {
        if (!sessionId || !cols || !rows) {
          return NextResponse.json(
            { error: 'sessionId, cols, and rows are required' },
            { status: 400 }
          );
        }

        const success = ptyManager.resize(sessionId, cols, rows);
        if (!success) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true });
      }

      case 'destroy': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId is required' },
            { status: 400 }
          );
        }

        ptyManager.destroySession(sessionId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Terminal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Stream output via SSE
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  const session = ptyManager.getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send any buffered output first
      const buffer = ptyManager.getOutputBuffer(sessionId);
      if (buffer.length > 0) {
        const initialData = buffer.join('');
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'data', data: initialData })}\n\n`)
        );
        ptyManager.clearOutputBuffer(sessionId);
      }

      // Listen for new data
      const dataHandler = ({ sessionId: sid, data }: { sessionId: string; data: string }) => {
        if (sid === sessionId) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'data', data })}\n\n`)
            );
          } catch {
            // Stream closed
          }
        }
      };

      // Listen for exit
      const exitHandler = ({ sessionId: sid, exitCode }: { sessionId: string; exitCode: number }) => {
        if (sid === sessionId) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'exit', exitCode })}\n\n`)
            );
            controller.close();
          } catch {
            // Stream already closed
          }
        }
      };

      ptyManager.on('data', dataHandler);
      ptyManager.on('exit', exitHandler);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        ptyManager.off('data', dataHandler);
        ptyManager.off('exit', exitHandler);
        clearInterval(heartbeat);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// DELETE - Destroy session
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  ptyManager.destroySession(sessionId);
  return NextResponse.json({ success: true });
}
