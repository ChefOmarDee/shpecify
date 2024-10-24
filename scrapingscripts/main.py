import os
import time
import json
import requests
import PyPDF2
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

# Load environment variables from the .env file
load_dotenv('./.env')

# Access the API keys and MongoDB connection string from environment variables
api_key = os.getenv("OPENAI_KEY")
mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
db_name = os.getenv("MONGODB_DB_NAME", "yourdbname")

class CompanyDataProcessor:
    def __init__(self):
        # Initialize MongoDB connection
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.companies = self.db.companies
        
        # Create indexes to match the Node.js schema
        self.companies.create_index([
            ("about", "text"),
            ("business_model", "text"),
            ("example_projects", "text")
        ])
        self.companies.create_index([("keywords", 1)])
        self.companies.create_index([("name", 1)], unique=True)

    def process_company_pdf(self):
        pdf_path = "./comps.pdf"

        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                total_pages = len(reader.pages)

                for page_num in range(total_pages):
                    print(f"Processing page {page_num + 1} of {total_pages}")
                    try:
                        page_text = self._get_page_text(reader, page_num)
                        prompt = self._create_prompt(page_text)
                        company_data = self._get_openai_response(prompt)
                        
                        # Insert or update the company in MongoDB
                        self._save_to_mongodb(company_data)
                        print(f"Processed and saved company: {company_data['company_name']}")

                    except Exception as e:
                        print(f"Error processing page {page_num + 1}: {e}")
                        continue

                    # Add delay to respect API rate limits
                    time.sleep(1)

        except Exception as e:
            print(f"Error reading the PDF file: {e}")
            raise

    def _get_page_text(self, reader, page_num):
        page = reader.pages[page_num]
        return page.extract_text()

    def _create_prompt(self, page_text):
        return f"""
            You are an AI assistant specializing in data extraction and company profile analysis. Before processing the text into JSON format, please provide brief summaries of:

            1. About: What is the core purpose and main activities of the company?
            2. Example Projects: What specific work or achievements has the company completed?
            3. Business Models: How does the company generate revenue and what type of customers does it serve?

            After providing these summaries, please structure the company profile into this JSON format:

            Example output:
            {{
                "company_name": "Tech Innovators Inc.",
                "about": "Tech Innovators Inc. is a leading provider of innovative software solutions for businesses worldwide.",
                "example_projects": "Developed AI-driven marketing tools for Fortune 500 companies.",
                "business_model": "B2B (Business-to-Business) providing software solutions via SaaS.",
                "majors_hiring": ["Computer Science", "Data Science", "Software Engineering"],
                "keywords": ["AI", "software", "SaaS", "innovation", "B2B", "automation", "cloud", "analytics", "technology", "machinelearning", "enterprise", "data", "solutions", "global", "scalable"]
            }}

            Requirements:
            - The "keywords" field must contain exactly 15 single-word keywords that best describe the company, its industry, and the technologies it uses. Ensure no spaces or hyphens in keywords.
            - Avoid generic words like "company" or "service" unless absolutely relevant to the industry.
            - Ensure the JSON is valid and contains no additional text or explanations.
            - If any field is missing in the source text, leave it as an empty string.

            Source text:
            {page_text}
        """

    def _get_openai_response(self, prompt):
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 2000,
            "temperature": 0.5
        }

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )

        response_data = response.json()
        company_data = json.loads(response_data['choices'][0]['message']['content'].strip())

        # Validate the keywords array
        if any(' ' in keyword for keyword in company_data['keywords']):
            raise ValueError("Keywords must be exactly 15 single words.")

        return company_data

    def _save_to_mongodb(self, company_data):
        # Transform the data to match your mongoose schema
        document = {
            "name": company_data["company_name"],
            "about": company_data["about"],
            "example_projects": company_data["example_projects"],
            "business_model": company_data["business_model"],
            "majors_hiring": company_data["majors_hiring"],
            "keywords": company_data["keywords"]
        }

        try:
            # Using upsert to update if exists, insert if doesn't
            self.companies.update_one(
                {"name": document["name"]},
                {"$set": document},
                upsert=True
            )
        except DuplicateKeyError:
            print(f"Company {document['name']} already exists, updating instead.")
        except Exception as e:
            print(f"Error saving to MongoDB: {e}")
            raise

    def close(self):
        self.client.close()

# Example usage
if __name__ == "__main__":
    processor = CompanyDataProcessor()
    try:
        processor.process_company_pdf()
    finally:
        processor.close()