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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
      </div>
    );

  if (!company) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 mb-6"
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

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{company.name}</h1>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">About</h3>
            <p className="text-gray-700">{company.about}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Business Model</h3>
            <p className="text-gray-700">{company.business_model}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Projects</h3>
            <p className="text-gray-700">{company.example_projects}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Majors Hiring</h3>
            <div className="flex flex-wrap gap-2">
              {company.majors_hiring.map((major) => (
                <span
                  key={major}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {major}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
