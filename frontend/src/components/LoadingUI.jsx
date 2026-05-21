import React from 'react';

/**
 * DashRing: Component Loading vòng tròn xoay đứt đoạn.
 * Bạn có thể truyền className để tùy chỉnh kích thước, màu sắc (ví dụ: className="w-6 h-6 text-blue-600").
 */
function DashRing({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      className={`animate-spin ${className}`}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        opacity="0.1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="9.5" 
        strokeWidth="2" 
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dasharray"
          values="0 150;42 150;42 150"
          keyTimes="0;0.5;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          values="0;-16;-59"
          keyTimes="0;0.5;1"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

/**
 * BouncingDots: Component loading ba dấu chấm nảy lên xuống.
 * Bạn có thể tùy chỉnh kích thước, màu sắc bằng className (ví dụ: className="w-8 h-3 text-blue-600").
 * Có thể điều chỉnh số lượng dấu chấm bằng thuộc tính `dots` (mặc định là 3).
 */
function BouncingDots({
  className = "",
  dots = 3,
  ...props
}) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-bouncing-dots {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.3;
            scale: 0.9;
          }
          40% {
            transform: translateY(-7px);
            opacity: 1;
            scale: 1.1;
          }
        }
      `}</style>
      <span
        role="status"
        className={`inline-flex items-center justify-center gap-1.5 ${className}`}
        {...props}
      >
        {Array.from({ length: dots }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="inline-block w-2 h-2 rounded-full bg-current"
            style={{
              animation: "loading-ui-bouncing-dots 1.2s infinite ease-in-out both",
              animationDelay: `${index * 0.16}s`,
            }}
          />
        ))}
        <span className="sr-only">Loading</span>
      </span>
    </>
  );
}

/**
 * Ripple: Component loading vòng tròn gợn sóng lan tỏa (Ripple Effect).
 * Bạn có thể truyền className để tùy chỉnh kích thước, màu sắc (ví dụ: className="w-8 h-8 text-blue-500").
 */
function Ripple({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <title>Loading...</title>
      <g fill="none" fillRule="evenodd" strokeWidth="2">
        <circle cx="22" cy="22" r="1">
          <animate
            attributeName="r"
            begin="0s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.165, 0.84, 0.44, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 20"
          />
          <animate
            attributeName="stroke-opacity"
            begin="0s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.3, 0.61, 0.355, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 0"
          />
        </circle>
        <circle cx="22" cy="22" r="1">
          <animate
            attributeName="r"
            begin="-0.9s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.165, 0.84, 0.44, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 20"
          />
          <animate
            attributeName="stroke-opacity"
            begin="-0.9s"
            calcMode="spline"
            dur="1.8s"
            keySplines="0.3, 0.61, 0.355, 1"
            keyTimes="0; 1"
            repeatCount="indefinite"
            values="1; 0"
          />
        </circle>
      </g>
    </svg>
  );
}

export { DashRing, BouncingDots, Ripple };



