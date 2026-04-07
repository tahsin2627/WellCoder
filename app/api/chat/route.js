import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, model } = body; 

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "SYSTEM ERROR: API Key missing." }, { status: 400 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://well-coder.vercel.app", 
        "X-Title": "WellCoder", 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": model || "meta-llama/llama-3.1-8b-instruct:free",
        "stream": true, // NEW: This turns on real-time typing!
        "messages": [
          { role: "system", content: "You are WellCoder, an elite AI software engineer." },
          { role: "user", content: message }
        ]
      })
    });

    // Pass the raw stream directly back to the frontend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
