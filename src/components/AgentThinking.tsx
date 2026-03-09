interface AgentThinkingProps {
  message?: string;
}

export default function AgentThinking({ message = "Working on it ..." }: AgentThinkingProps) {
  return (
    <div className="flex items-center gap-3 h-10 relative overflow-hidden">
      {/* Animated Avatar - rotating clover shape */}
      <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full opacity-40 blur-md"
          style={{
            background: 'radial-gradient(circle, #F9D695 0%, transparent 70%)',
          }}
        />

        {/* Main clover shape - rotating */}
        <svg
          className="w-8 h-8 relative"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            animation: 'rotate 3s linear infinite',
            transformOrigin: 'center center',
          }}
        >
          <defs>
            <radialGradient
              id="cloverGradient"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(16 12) rotate(60) scale(18)"
            >
              <stop stopColor="#F5A05C" stopOpacity="0.9" />
              <stop offset="0.5" stopColor="#F9C87C" stopOpacity="0.7" />
              <stop offset="1" stopColor="#FBEACC" stopOpacity="0.5" />
            </radialGradient>
          </defs>
          {/* Soft clover/diamond shape */}
          <path
            d="M16.3728 3.47304L19.9127 6.03593L24.2506 6.56644C28.9458 7.13865 31.3024 12.5428 28.527 16.3728L25.9641 19.9127L25.4336 24.2506C24.8613 28.9458 19.4572 31.3024 15.6272 28.527L12.0873 25.9641L7.74943 25.4336C3.05424 24.8613 0.697584 19.4572 3.47304 15.6272L6.03593 12.0873L6.56645 7.74943C7.13865 3.05424 12.5428 0.697583 16.3728 3.47304Z"
            fill="url(#cloverGradient)"
          />
        </svg>
      </div>

      {/* Status text with shine effect container */}
      <div className="relative overflow-hidden">
        <p
          className="text-[16px] font-light tracking-wide"
          style={{
            fontFamily: "'Manrope', sans-serif",
            color: '#9BA2AF',
          }}
        >
          {message}
        </p>
        {/* Shine effect overlay on text */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
            animation: 'shine 2s ease-in-out infinite',
            width: '100%',
          }}
        />
      </div>

      {/* Shine effect that sweeps across the entire component */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)',
          animation: 'shineSweep 2.5s ease-in-out infinite',
          width: '50%',
        }}
      />

      <style>
        {`
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes shine {
            0% {
              transform: translateX(-100%);
            }
            50%, 100% {
              transform: translateX(200%);
            }
          }
          @keyframes shineSweep {
            0% {
              transform: translateX(-100%);
            }
            50%, 100% {
              transform: translateX(400%);
            }
          }
        `}
      </style>
    </div>
  );
}
