import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "No URL provided." }, { status: 400 });
    }

    // We use r.jina.ai to magically strip all ads, menus, and garbage HTML
    // and return pure, AI-readable Markdown text from any URL.
    const response = await fetch(`https://r.jina.ai/${url}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status}`);
    }

    const markdownText = await response.text();

    // Limit the text size so we don't blow up the AI's context limit
    const truncatedText = markdownText.slice(0, 15000);

    return NextResponse.json({ content: truncatedText });
  } catch (error) {
    console.error("Scraper Error:", error);
    return NextResponse.json({ error: "Failed to read the provided URL." }, { status: 500 });
  }
}
