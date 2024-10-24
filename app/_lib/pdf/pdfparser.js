import path from "path";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import pdf from "pdf-parse";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const apiKey = process.env.OPENAI_KEY;

export async function processCompanyPDF() {
    const companies = []; // Array to store all company data

    // Read the PDF file
    let dataBuffer;
    try {
        dataBuffer = fs.readFileSync("./app/_lib/pdf/comps.pdf");
    } catch (err) {
        console.error("Error reading the PDF file:", err.message);
        throw err;
    }

    // Parse PDF
    const data = await pdf(dataBuffer);
    const totalPages = data.numpages;

    // Process each page
    for (let pageNum = 1; pageNum <= 2; pageNum++) {
        console.log(`Processing page ${pageNum} of ${totalPages}`);
        try {
            const pageText = await getPageText(dataBuffer, pageNum);

            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            };

            const prompt = `
            Extract the following information from this company profile text and return it as a JSON object. Do not include any markdown formatting or additional text:
            {
                "company_name": "string (exact text from source)",
                "about": "string (exact text from source)",
                "example_projects": "string (exact text from source)",
                "business_model": "string (exact text from source)",
                "majors_hiring": ["array", "of", "string", "majors", "exact", "text"],
                "keywords": ["array", "of", "exactly", "15", "single", "word", "keywords"]
            }
        Requirements:
        - Keep all text exactly as it appears in the source for company_name, about, example_projects, business_model, and majors_hiring
        - For keywords: Generate EXACTLY 15 single-word keywords that best describe this company, its industry, and technologies used
        - Ensure keywords array contains exactly 15 elements
        - Each keyword must be a single word (no spaces)
        - The response must be a valid JSON object
        - Do not include any explanation or additional text outside the JSON object
            Source text:
            ${pageText}`;
        

            const payload = {
                model: "gpt-4",  // Fixed model name typo
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: 2000,
                temperature: 0.5,
            };

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                payload,
                { headers }
            );

            let companyData;
            try {
                // Remove any potential markdown formatting before parsing
                const cleanContent = response.data.choices[0].message.content.replace(/\bjson\n?|\n?/g, '').trim();
                companyData = JSON.parse(cleanContent);

                // Validate keywords array
                if (!Array.isArray(companyData.keywords) || companyData.keywords.length !== 15) {
                    throw new Error('Keywords must be an array of exactly 15 elements');
                }

                // Validate that each keyword is a single word
                if (companyData.keywords.some(keyword => keyword.includes(' '))) {
                    throw new Error('Each keyword must be a single word');
                }

                // Add to companies array
                companies.push(companyData);
                console.log(companyData);

            } catch (parseError) {
                console.error(`Error parsing JSON for page ${pageNum}:`, parseError);
                continue;
            }

            // Add delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(
                `Error processing page ${pageNum}:`,
                error.response ? error.response.data : error.message
            );
            continue;
        }
    }

    return companies;
}

async function getPageText(dataBuffer, pageNum) {
    const options = {
        max: pageNum,
        pagerender: function(pageData) {
            return pageData.getTextContent()
                .then(function(textContent) {
                    return textContent.items
                        .map(item => item.str)
                        .join(' ');
                });
        }
    };

    const data = await pdf(dataBuffer, options);
    return data.text;
}
