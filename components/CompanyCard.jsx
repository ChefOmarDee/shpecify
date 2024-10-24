import React from "react";

const CompanyCard = ({ company, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
    >
      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
        {company.name}
      </h3>
    </div>
  );
};

export default CompanyCard;
