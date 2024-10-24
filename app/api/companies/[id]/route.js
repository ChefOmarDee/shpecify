// app/api/companies/[id]/route.js
import { NextResponse } from "next/server";
import mongoose from 'mongoose';

// Reuse the same MongoDB connection function and Company model from the search API
async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error('Failed to connect to MongoDB');
    }
}

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    about: { type: String, required: true },
    example_projects: { type: String },
    business_model: { type: String, required: true },
    majors_hiring: { type: [String], required: true },
    keywords: { type: [String] }
});

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export async function GET(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: "Company ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const company = await Company.findById(id);
        
        if (!company) {
            return NextResponse.json(
                { error: "Company not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(company, { status: 200 });

    } catch (error) {
        console.error("Error in company details API:", error);
        return NextResponse.json(
            { error: "Failed to fetch company details" },
            { status: 500 }
        );
    }
}