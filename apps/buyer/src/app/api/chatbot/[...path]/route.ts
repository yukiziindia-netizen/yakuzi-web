import { NextRequest, NextResponse } from "next/server";

const CHATBOT_URL = process.env.CHATBOT_URL || "http://127.0.0.1:5005";

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    const targetUrl = `${CHATBOT_URL}/${resolvedParams.path.join("/")}`;
    
    // Check if it's multipart (file upload)
    const contentType = req.headers.get("content-type") || "";
    
    let body;
    const headers: Record<string, string> = {};
    
    if (contentType.includes("multipart/form-data")) {
      body = await req.formData();
      // For formData in fetch, don't set Content-Type header manually, let fetch do it with the boundary
    } else {
      body = await req.text();
      headers["Content-Type"] = contentType || "application/json";
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Chatbot Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    const targetUrl = `${CHATBOT_URL}/${resolvedParams.path.join("/")}`;
    
    const response = await fetch(targetUrl, {
      method: "GET",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Chatbot Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
