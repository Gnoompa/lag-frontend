export default function PrimaryButton({ children }) {
  return (
    <svg width="178" height="85" viewBox="0 0 178 85" xmlns="http://www.w3.org/2000/svg">
      <mask id="path-1-inside-1_345_847" fill="white">
        <path d="M0 0H145C163.225 0 178 14.7746 178 33V84.7619H33C14.7746 84.7619 0 69.9873 0 51.7619V0Z" />
      </mask>
      <path
        d="M0 0H178H0ZM178 84.7619H0H178ZM33 84.7619C14.2223 84.7619 -1 69.5396 -1 50.7619V0H1V51.7619C1 69.9873 15.3269 84.7619 33 84.7619ZM145 0C163.778 0 179 15.2223 179 34V84.7619H177V33C177 14.7746 162.673 0 145 0Z"
        fill="#53FFD8"
        mask="url(#path-1-inside-1_345_847)"
      />
      <path
        d="M3.3252 0.5H142.174C160.124 0.5 174.674 15.0507 174.674 33V84.2619H35.8252C17.876 84.2619 3.3252 69.7112 3.3252 51.7619V0.5Z"
        stroke="#53FFD8"
      />
      <path
        d="M11.3018 5.65088H136.699C153.267 5.65088 166.699 19.0823 166.699 35.6509V79.1112H41.3017C24.7332 79.1112 11.3018 65.6797 11.3018 49.1112V5.65088Z"
        fill="#53FFD8"
        fill-opacity="0.12"
      />
      <path
        d="M11.3018 5.65088H136.699C153.267 5.65088 166.699 19.0823 166.699 35.6509V79.1112H41.3017C24.7332 79.1112 11.3018 65.6797 11.3018 49.1112V5.65088Z"
        fill="url(#paint0_radial_345_847)"
        fill-opacity="0.4"
      />
      <g>
        <text
          fill="#53FFD8"
          fontSize={"1.25rem"}
          fontWeight={"bold"}
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
        >
          {children}
        </text>
      </g>

      <defs>
        <radialGradient
          id="paint0_radial_345_847"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(89.2807 79.1112) scale(86.1134 40.7082)"
        >
          <stop stop-color="#53FFD8" />
          <stop offset="1" stop-color="#F1FF53" stop-opacity="0" />
          <stop offset="1.0001" stop-color="#F1FF53" stop-opacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
