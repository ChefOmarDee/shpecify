import { NextResponse } from "next/server";
import mongoose from 'mongoose';

// MongoDB connection function remains the same
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

// Schema definition remains the same
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    about: { type: String, required: true },
    example_projects: { type: String },
    business_model: { type: String, required: true },
    majors_hiring: { type: [String], required: true },
    keywords: { type: [String] }
});

companySchema.index({ about: 'text', business_model: 'text', example_projects: 'text' });
companySchema.index({ keywords: 1 });
companySchema.index({ name: 1 });

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export async function POST(request) {
    try {
        // Get search parameters from request body
        const { major, keywords } = await request.json();

        // Connect to MongoDB
        await connectDB();

        // Create case variations for each keyword
        const keywordQueries = (keywords || []).map(keyword => {
            const variations = [
                keyword,
                keyword.toLowerCase(),
                keyword.toUpperCase(),
                keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase()
            ];
            return [...new Set(variations)];
        });

        // Construct the base query for major
        let query = {};
        if (major) {
            query.majors_hiring = major;
        }

        if (keywords && keywords.length > 0) {
            // Create an array to store results for each keyword
            const allResults = await Promise.all(keywords.map(async (keyword) => {
                const variations = [
                    keyword,
                    keyword.toLowerCase(),
                    keyword.toUpperCase(),
                    keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase()
                ];
                
                // Search for each keyword in both keywords array and text fields
                const keywordResults = await Company.find({
                    ...query,
                    keywords: { $in: variations }
                })
                .select('_id name')
                .lean();

                const textResults = await Company.find({
                    ...query,
                    $text: { $search: keyword }
                })
                .select('_id name')
                .lean();

                // Combine and deduplicate results for this keyword
                return [...keywordResults, ...textResults].reduce((unique, item) => {
                    const exists = unique.some(u => u._id.toString() === item._id.toString());
                    if (!exists) {
                        unique.push(item);
                    }
                    return unique;
                }, []);
            }));

            // Find companies that appear in all keyword result sets (AND logic)
            const intersection = allResults.reduce((acc, curr) => {
                if (acc.length === 0) return curr;
                return acc.filter(accItem => 
                    curr.some(currItem => 
                        currItem._id.toString() === accItem._id.toString()
                    )
                );
            }, []);

            // Sort the final results by name
            intersection.sort((a, b) => 
                a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'en', {
                    numeric: true,
                    sensitivity: 'base'
                })
            );

            return NextResponse.json(intersection, { status: 200 });
        } else {
            // If no keywords, just return companies matching the major
            const companies = await Company.find(query)
                .select('_id name')
                .collation({ locale: 'en', strength: 1, numericOrdering: true })
                .sort({ name: 1 })
                .lean();

            return NextResponse.json(companies, { status: 200 });
        }

    } catch (error) {
        console.error("Error in company search API:", error);
        return NextResponse.json(
            { error: "Failed to search companies" },
            { status: 500 }
        );
    }
}