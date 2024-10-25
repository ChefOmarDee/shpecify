import React from "react";

const CompanyCard = ({ company, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-navy-800 border border-orange-500 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-102 transform hover:border-orange-600"
    >
      <h3 className="text-lg font-semibold text-white hover:text-orange-400 transition-colors">
        {company.name}
      </h3>
    </div>
  );
};

export default CompanyCard;
