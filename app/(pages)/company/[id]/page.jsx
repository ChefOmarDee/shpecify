"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CompanyDetails = ({ params: paramsPromise }) => {
  const router = useRouter();
  const params = React.use(paramsPromise);
  const { id } = params;
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/companies/${id}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);
        setCompany(data);
      } catch (error) {
        setError("Failed to fetch company details.");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-navy-900 bg-gradient-to-b from-navy-800 to-navy-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-gray-300">Loading...</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-navy-900 bg-gradient-to-b from-navy-800 to-navy-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="p-4 bg-red-900/50 text-red-200 rounded-lg border border-red-700">
            {error}
          </div>
        </div>
      </div>
    );

  if (!company) return null;

  return (
    <div className="min-h-screen bg-navy-900 bg-gradient-to-b from-navy-800 to-navy-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 mb-8 transition-colors duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back to Search</span>
        </button>

        <div className="bg-navy-800 rounded-lg border border-orange-600 shadow-lg p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-orange-500">
            {company.name}
          </h1>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">About</h3>
              <p className="text-gray-300">{company.about}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">
                Business Model
              </h3>
              <p className="text-gray-300">{company.business_model}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">
                Example Projects
              </h3>
              <p className="text-gray-300">{company.example_projects}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">
                Majors Hiring
              </h3>
              <div className="flex flex-wrap gap-2">
                {company.majors_hiring.map((major) => (
                  <span
                    key={major}
                    className="px-4 py-2 bg-navy-900/50 text-orange-400 border border-orange-500/30 rounded-full text-sm font-medium"
                  >
                    {major}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
