// src/components/auth/FormRow.jsx

import React from "react";

const FormRow = ({
  children,
  cols = 2,
  className = "",
}) => {
  
  // GRID COLUMN STYLES
  const columnStyles = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  };

  return (
    <div
      className={`
        grid
        ${columnStyles[cols]}
        
        gap-6
        w-full
        
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default FormRow;