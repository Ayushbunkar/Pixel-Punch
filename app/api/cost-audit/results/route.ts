export async function GET(request: Request) {
  return new Response('Hello from cost-audit results API!')
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received form submission:', body);
    return new Response(JSON.stringify({ message: 'Form submitted successfully!', data: body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}