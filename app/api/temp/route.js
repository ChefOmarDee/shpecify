import { NextResponse } from "next/server";



export async function GET() {
    try {
        return NextResponse.json({ message: "success" }, {status: 200});
    } catch (error) {
        console.error("Error in getinfo API:", error);
        return NextResponse.json({error: "Failed to get information"} ,{status: 500});
    }
}