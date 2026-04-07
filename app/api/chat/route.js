import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, model } = body; // Now receiving 'model' from the frontend

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "SYSTEM ERROR: API Key missing in Vercel Environment Variables." }, { status: 400 });
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
        // Use the model selected in the UI, or fallback to a free one
        "model": model || "meta-llama/llama-3-8b-instruct:free",
        "messages": [
          { role: "system", content: "You are WellCoder, an elite AI software engineer. Provide concise, accurate coding assistance." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // If OpenRouter rejects the request, throw their exact error message
    if (!response.ok) {
      throw new Error(data.error?.message || `OpenRouter API error: ${response.status}`);
    }
    
    const aiReply = data.choices[0].message.content;

    return NextResponse.json({ reply: aiReply });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request with OpenRouter." }, { status: 500 });
  }
}
