import React from "react";
import Link from "next/link"; // Import the Link component

const CompanyCard = ({ company }) => {
  return (
    <Link href={`/company/${company._id}`} passHref>
      <div className="bg-navy-800 border border-orange-500 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-102 transform hover:border-orange-600">
        <h3 className="text-lg font-semibold text-white hover:text-orange-400 transition-colors">
          {company.name}
        </h3>
      </div>
    </Link>
  );
};

export default CompanyCard;
