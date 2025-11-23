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
        backgroundColor: '#fdcff3' // Fallback color
      }}
    >
      <img
        src="/AppBackground.jpg"
        alt=""
        className="w-full h-full object-cover"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        loading="eager"
      />
    </div>
  );
}

