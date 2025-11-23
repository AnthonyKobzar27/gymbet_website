export default function BackgroundImage() {
  return (
    <div 
      className="fixed inset-0 -z-10"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#fdcff3', // Fallback color
        overflow: 'hidden',
      }}
    >
      {/* Make image 200vh tall to prevent lazy loading during scroll */}
      <img
        src="/AppBackground.jpg"
        alt=""
        style={{
          position: 'fixed',
          top: '-50%', // Extend beyond viewport
          left: 0,
          width: '100%',
          height: '200vh', // 2x viewport height so it covers all scroll positions
          objectFit: 'cover',
          objectPosition: 'center',
          willChange: 'transform',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          pointerEvents: 'none',
        }}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
      />
    </div>
  );
}

