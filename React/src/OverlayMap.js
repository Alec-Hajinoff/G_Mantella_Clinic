import React from "react";
import "./OverlayMap.css";
import earPng from "./Images/ear-hotspots-png.png";

function OverlayMap() {
  return (
    <div className="overlay-map-container">
      <img
        src={earPng}
        alt="Ear piercing placement chart"
        className="overlay-map-image"
      />

      <svg
        className="overlay-map-svg"
        viewBox="0 0 2875 2646"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          id="lobe"
          d="M743.04,1951.374c7.653,42.089 -34.436,413.232 34.436,443.842c68.872,30.61 948.903,76.524 983.339,42.088c34.436,-34.436 91.829,-137.744 15.305,-168.354c-76.524,-30.61 -646.632,42.088 -654.284,-3.826c-7.653,-45.915 38.262,-271.662 -19.131,-302.272c-57.393,-30.61 -367.317,-53.567 -359.665,-11.479Z"
          className="hotspot"
          onClick={() => {
            /* Do nothing for now */
          }}
        />

        <path
          id="helix"
          d="M1925.343,688.72c-34.436,42.088 -72.698,218.095 -7.652,233.4c65.046,15.305 661.936,22.957 696.373,-7.653c34.436,-30.61 57.394,-241.052 3.826,-256.357c-53.567,-15.305 -658.111,-11.479 -692.547,30.61Z"
          className="hotspot"
          onClick={() => {
            /* Do nothing for now */
          }}
        />
      </svg>
    </div>
  );
}

export default OverlayMap;
