import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    // Forward authorization header if present
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Forward request to the backend
    const backendResponse = await fetch(`http://localhost:8080/api/rooms/${roomId}`, {
      method: 'GET',
      headers,
    });

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Error in room by ID API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 