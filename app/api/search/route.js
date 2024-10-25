// First, let's update the API route (api/search/route.js)
import { NextResponse } from "next/server";
import mongoose from 'mongoose';

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

// Add text index for company name
companySchema.index({ name: 'text', about: 'text', business_model: 'text', example_projects: 'text' });
companySchema.index({ keywords: 1 });

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export async function POST(request) {
    try {
        const { major, keyword, companyName } = await request.json();
        await connectDB();

        let query = {};

        // Add major filter if provided
        if (major) {
            query.majors_hiring = major;
        }

        // Add keyword search if provided
        if (keyword) {
            const keywordVariations = [
                keyword,
                keyword.toLowerCase(),
                keyword.toUpperCase(),
                keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase()
            ];
            const uniqueKeywordVariations = [...new Set(keywordVariations)];

            query.$or = [
                { $text: { $search: keyword } },
                { keywords: { $in: uniqueKeywordVariations } }
            ];
        }

        // Add company name search if provided
        if (companyName) {
            // If there's already an $or, we need to use $and to combine conditions
            if (query.$or) {
                query = {
                    $and: [
                        { ...query },
                        {
                            $or: [
                                { name: { $regex: companyName, $options: 'i' } },
                                { name: { $regex: companyName.split('').join('.*'), $options: 'i' } }
                            ]
                        }
                    ]
                };
            } else {
                query.$or = [
                    { name: { $regex: companyName, $options: 'i' } },
                    { name: { $regex: companyName.split('').join('.*'), $options: 'i' } }
                ];
            }
        }

        const companies = await Company.find(query)
            .select('_id name')
            .lean();

        return NextResponse.json(companies, { status: 200 });

    } catch (error) {
        console.error("Error in company search API:", error);
        return NextResponse.json(
            { error: "Failed to search companies" },
            { status: 500 }
        );
    }
}
