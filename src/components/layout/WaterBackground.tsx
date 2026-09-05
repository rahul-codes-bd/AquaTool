import React from 'react';

export const WaterBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-[#020617]" aria-hidden="true">
      {/* Frosted ambient glow spots with subtle fluid drift */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/25 rounded-full blur-[130px] aqua-drift-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[550px] h-[550px] bg-teal-950/30 rounded-full blur-[120px] aqua-drift-2" />
      <div className="absolute top-[30%] right-[5%] w-[350px] h-[350px] bg-sky-900/20 rounded-full blur-[90px] aqua-pulse-glow" />

      {/* Subtle fine frosted caustics mesh overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};


