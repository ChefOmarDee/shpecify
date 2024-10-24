import { NextResponse } from "next/server";

import { processCompanyPDF } from "@/app/_lib/pdf/pdfparser";


export async function GET() {
    try {
        await processCompanyPDF();
        return NextResponse.json({ message: "success" }, {status: 200});
    } catch (error) {
        console.error("Error in getinfo API:", error);
        return NextResponse.json({error: "Failed to get information"} ,{status: 500});
    }
}