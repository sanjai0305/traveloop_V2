import React, { useRef, useEffect, useState } from "react";

const ScratchCardCanvas = ({ width = 280, height = 300, onScratchComplete, children }) => {
  const canvasRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw silver coating background
    ctx.fillStyle = "#CBD5E1"; // Silver gray
    ctx.fillRect(0, 0, width, height);

    // 2. Draw card overlay border/frame
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // 3. Draw text message
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🎁 SCRATCH TO REVEAL REWARD", width / 2, height / 2 - 10);

    ctx.fillStyle = "#64748B";
    ctx.font = "medium 11px sans-serif";
    ctx.fillText("Swipe/Drag to clear coating", width / 2, height / 2 + 15);

    // 4. Draw random noise/sparkles
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [width, height]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e) => {
    setIsScratching(true);
    handleScratch(e);
  };

  const handleEnd = () => {
    setIsScratching(false);
  };

  const handleScratch = (e) => {
    if (!isScratching || isComplete) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getMousePos(e);

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2); // 22px brush size
    ctx.fill();

    checkScratchedPercentage();
  };

  const checkScratchedPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    let transparent = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) {
        transparent++;
      }
    }

    const percentage = (transparent / (pixels.length / 4)) * 100;
    if (percentage > 45 && !isComplete) {
      setIsComplete(true);
      onScratchComplete();
    }
  };

  return (
    <div className="relative overflow-hidden select-none rounded-2xl mx-auto shadow-lg" style={{ width, height }}>
      {/* Underlying revealed content */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* Silver canvas coating */}
      {!isComplete && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleStart}
          onMouseMove={handleScratch}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleScratch}
          onTouchEnd={handleEnd}
          className="absolute inset-0 z-10 cursor-crosshair touch-none"
        />
      )}
    </div>
  );
};

export default ScratchCardCanvas;
