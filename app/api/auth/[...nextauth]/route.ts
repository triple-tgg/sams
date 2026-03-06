import { NextResponse } from "next/server"

// Minimal session endpoint for SessionProvider compatibility.
// The app uses Redux + localStorage for auth, not NextAuth sessions.
export async function GET() {
    return NextResponse.json({})
}

export async function POST() {
    return NextResponse.json({})
}
