import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { message } = body;

    // We check if you have set up your API key in Vercel
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ reply: "SYSTEM ERROR: OPENROUTER_API_KEY is missing. Please add it to your Vercel Environment Variables." });
    }

    // Call the OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://well-coder.vercel.app", // Required by OpenRouter
        "X-Title": "WellCoder", // Required by OpenRouter
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // We are using a free Llama model to start, so it costs you nothing to test!
        // You can change this to "anthropic/claude-3-opus" or "anthropic/claude-3-sonnet" later.
        "model": "meta-llama/llama-3-8b-instruct:free",
        "messages": [
          { role: "system", content: "You are WellCoder, an elite AI software engineer. Provide concise, accurate coding assistance." },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the AI's reply from the OpenRouter response
    const aiReply = data.choices[0].message.content;

    return NextResponse.json({ reply: aiReply });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process request with OpenRouter." }, { status: 500 });
  }
}
