import { NextResponse } from "next/server";
import mongoose from 'mongoose';

// MongoDB connection function
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

// Define Company Schema
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    about: { type: String, required: true },
    example_projects: { type: String },
    business_model: { type: String, required: true },
    majors_hiring: { type: [String], required: true },
    keywords: { type: [String] }
});

// Create text index on specific fields
companySchema.index({ about: 'text', business_model: 'text', example_projects: 'text' });
companySchema.index({ keywords: 1 });

// Get the Company model (with protection against model recompilation)
const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export async function POST(request) {
    try {
        // Get search parameters from request body
        const { major, keyword } = await request.json();

        // Connect to MongoDB
        await connectDB();

        // Create case variations of the keyword
        const keywordVariations = keyword ? [
            keyword,
            keyword.toLowerCase(),
            keyword.toUpperCase(),
            keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase() // Capitalized
        ] : [];

        // Remove duplicates from variations
        const uniqueKeywordVariations = [...new Set(keywordVariations)];

        // Construct the query
        const query = {
            ...(major && { majors_hiring: major }),
            ...(keyword && {
                $or: [
                    { $text: { $search: keyword } },
                    { keywords: { $in: uniqueKeywordVariations } }
                ]
            })
        };

        // Execute the query with only _id and name fields
        const companies = await Company.find(query)
            .select('_id name')  // Only return _id and name fields
            .lean();  // Convert to plain JavaScript objects for better performance

        // Return the results
        return NextResponse.json(companies, { status: 200 });

    } catch (error) {
        console.error("Error in company search API:", error);
        return NextResponse.json(
            { error: "Failed to search companies" },
            { status: 500 }
        );
    }
}