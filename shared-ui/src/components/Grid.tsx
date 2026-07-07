import React from "react";

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    largeDesktop?: number;
  };
  gap?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  children: React.ReactNode;
}

export const Grid: React.FC<GridProps> = ({
  cols = { mobile: 1, tablet: 2, desktop: 3, largeDesktop: 4 },
  gap = { mobile: "16px", tablet: "24px", desktop: "32px" },
  children,
  className = "",
  ...props
}) => {
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols.mobile}, 1fr)`,
    gap: gap.mobile,
  };

  // Responsive styles using media queries
  const responsiveStyles = `
    @media (min-width: 768px) {
      .responsive-grid {
        grid-template-columns: repeat(${cols.tablet}, 1fr);
        gap: ${gap.tablet};
      }
    }
    @media (min-width: 1024px) {
      .responsive-grid {
        grid-template-columns: repeat(${cols.desktop}, 1fr);
        gap: ${gap.desktop};
      }
    }
    @media (min-width: 1280px) {
      .responsive-grid {
        grid-template-columns: repeat(${cols.largeDesktop || cols.desktop}, 1fr);
      }
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      <div
        className={`responsive-grid ${className}`}
        style={gridStyle}
        {...props}
      >
        {children}
      </div>
    </>
  );
};

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span,
  className = "",
  ...props
}) => {
  const itemStyle: React.CSSProperties = {};

  if (span) {
    const responsiveSpan = `
      @media (min-width: 768px) {
        .responsive-grid-item {
          grid-column: span ${span.tablet || span.mobile};
        }
      }
      @media (min-width: 1024px) {
        .responsive-grid-item {
          grid-column: span ${span.desktop || span.tablet || span.mobile};
        }
      }
    `;
    
    if (span.mobile) {
      itemStyle.gridColumn = `span ${span.mobile}`;
    }

    return (
      <>
        <style>{responsiveSpan}</style>
        <div
          className={`responsive-grid-item ${className}`}
          style={itemStyle}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export default Grid;
