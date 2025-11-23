interface MiniLineChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export default function MiniLineChart({ 
  data, 
  color = '#000', 
  height = 60 
}: MiniLineChartProps) {
  const width = 180;
  const padding = 4;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const pathData = `M ${points}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <line 
        x1={padding} 
        y1={height / 2} 
        x2={width - padding} 
        y2={height / 2} 
        stroke="#E0E0E0" 
        strokeWidth="1" 
      />
      <path 
        d={pathData} 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
      />
      {data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((value - min) / range) * (height - 2 * padding);
        return (
          <circle 
            key={index} 
            cx={x} 
            cy={y} 
            r="3" 
            fill={color} 
          />
        );
      })}
    </svg>
  );
}



