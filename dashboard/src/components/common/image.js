import React from "react";

function Image({ src, alt, className, height, width }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      height={height}
      width={width}
    />
  );
}

export default Image;
