"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CompanyCard from "@/components/CompanyCard";

const generateExcel = (companies) => {
  const headers = ["Applied?", "Company Name"];
  const rows = companies.map((company) => [
    "", // Empty column for user to mark as applied
    company.name || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "companies_to_apply.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Home = () => {
  const router = useRouter();
  const [major, setMajor] = useState("");
  const [keyword, setKeyword] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const majorOptions = [
    "Accounting",
    "Aerospace Engineering",
    "Biomedical Engineering",
    "Business",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Engineering",
    "Computer Science",
    "Data Science",
    "Economics",
    "Electrical Engineering",
    "Environmental Engineering",
    "Finance",
    "Industrial Engineering",
    "Logistics",
    "Marketing",
    "Materials Science & Engineering",
    "Mechanical Engineering",
    "Nuclear Engineering",
    "Systems Engineering",
  ];

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ major, keyword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setCompanies(data);
    } catch (error) {
      setError("Failed to fetch companies. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (companyId) => {
    router.push(`/company/${companyId}`);
  };

  const handleExport = () => {
    if (companies.length > 0) {
      generateExcel(companies);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Find Companies</h1>

      <div className="space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <select
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a major</option>
              {majorOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="w-4 h-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          <input
            type="text"
            placeholder="Enter keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex space-x-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 md:flex-none px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors duration-200 ease-in-out"
            >
              {loading ? "Searching..." : "Search"}
            </button>

            {companies.length > 0 && (
              <button
                onClick={handleExport}
                className="flex-1 md:flex-none px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 ease-in-out"
              >
                Export to Excel
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading results...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                onClick={() => handleCompanyClick(company._id)}
              />
            ))}
            {companies.length === 0 && (
              <div className="text-gray-500 col-span-full">
                No results found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
