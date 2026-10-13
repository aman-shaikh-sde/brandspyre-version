import React, { useRef, useState, useEffect } from "react";
import { Circle, Square, Eraser, Trash2, Download, Undo, Redo } from "lucide-react";

interface WhiteboardProps {
  meetingId: string;
  strokes: any[];
  emitSocketEvent: (event: string, payload: any) => void;
}

export default function Whiteboard({ meetingId, strokes, emitSocketEvent }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // High resolution canvas logic
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;

    // Draw pre-existing strokes
    strokes.forEach(drawStroke);
  }, []);

  // Redraw canvas whenever strokes list changes (for sync with other peers)
  useEffect(() => {
    if (!contextRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(drawStroke);
  }, [strokes]);

  const drawStroke = (stroke: any) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.moveTo(stroke.prevX, stroke.prevY);
    ctx.lineTo(stroke.currX, stroke.currY);
    ctx.stroke();
    ctx.closePath();
  };

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    socketDrawState.current = { prevX: offsetX, prevY: offsetY };
  };

  const socketDrawState = useRef<{ prevX: number; prevY: number }>({ prevX: 0, prevY: 0 });

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    const { offsetX, offsetY } = nativeEvent;

    const stroke = {
      prevX: socketDrawState.current.prevX,
      prevY: socketDrawState.current.prevY,
      currX: offsetX,
      currY: offsetY,
      color,
      size: brushSize,
    };

    drawStroke(stroke);
    emitSocketEvent("draw-stroke", { stroke });

    socketDrawState.current = { prevX: offsetX, prevY: offsetY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    emitSocketEvent("clear-canvas", {});
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `whiteboard-${meetingId}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4">
      {/* Toolbars */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Colors */}
          <div className="flex gap-1.5">
            {["#ffffff", "#ef4444", "#3b82f6", "#10b981", "#eab308", "#a855f7"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border ${color === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-6 w-px bg-gray-700 mx-1" />

          {/* Brush Sizes */}
          <select
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none"
          >
            <option value="2">Thin (2px)</option>
            <option value="5">Medium (5px)</option>
            <option value="10">Thick (10px)</option>
            <option value="20">Extra Thick (20px)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-1.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition"
            title="Clear Board"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition"
            title="Export Image"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-[300px] bg-gray-950 rounded-lg overflow-hidden relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
}
