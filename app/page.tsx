"use client";
import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRHistoryItem {
  id: number;
  text: string;
  generatedAt: string;
  pngDataUrl: string;
}

export default function QRCodeGeneratorApp() {
  const [text, setText] = useState<string>("https://example.com");
  const [size, setSize] = useState<number>(300);
  const [margin, setMargin] = useState<number>(2);
  const [colorDark, setColorDark] = useState<string>("#000000");
  const [colorLight, setColorLight] = useState<string>("#ffffff");
  const [ecLevel, setEcLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [pngDataUrl, setPngDataUrl] = useState<string>("");
  const [svgText, setSvgText] = useState<string>("");
  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const STORAGE_KEY = "qr_history_v1";

  // Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const generate = async () => {
    if (!text.trim()) return;
    const options = {
      errorCorrectionLevel: ecLevel,
      margin: Number(margin),
      color: { dark: colorDark, light: colorLight },
      width: Number(size),
    };

    try {
      const dataUrl = await QRCode.toDataURL(text, options);
      setPngDataUrl(dataUrl);
      const svg = await QRCode.toString(text, { ...options, type: "svg" });
      setSvgText(svg);

      const item: QRHistoryItem = {
        id: Date.now(),
        text,
        generatedAt: new Date().toISOString(),
        pngDataUrl: dataUrl,
      };
      setHistory((prev) => [item, ...prev].slice(0, 50));
    } catch (err) {
      console.error("QR generate failed", err);
      alert("Failed to create QR code.");
    }
  };

  const downloadPNG = () => {
    if (!pngDataUrl) return;
    const a = document.createElement("a");
    a.href = pngDataUrl;
    a.download = `qr-${size}x${size}.png`;
    a.click();
  };

  const downloadSVG = () => {
    if (!svgText) return;
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${size}x${size}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPngToClipboard = async () => {
    if (!pngDataUrl) return alert("Generate a QR first.");
    try {
      const res = await fetch(pngDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      alert("PNG copied to clipboard");
    } catch {
      alert("Copy failed.");
    }
  };

  const clearHistory = () => {
    if (!confirm("Clear QR history?")) return;
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const useHistoryItem = (item: QRHistoryItem) => {
    setText(item.text);
    setTimeout(generate, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-black">
          QR Code Generator — no expiry
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Generate permanent QR codes (stored locally) — works completely
          offline.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Controls */}
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QR Code Content
              </label>
              <textarea
                rows={3}
                className="w-full p-2 border rounded resize-none text-gray-700"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size (px)
                </label>
                <input
                  type="number"
                  min={64}
                  max={2000}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full p-2 border rounded text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margin
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full p-2 border rounded text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Error Correction
                </label>
                <select
                  value={ecLevel}
                  onChange={(e) =>
                    setEcLevel(e.target.value as "L" | "M" | "Q" | "H")
                  }
                  className="w-full p-2 border rounded text-gray-700"
                >
                  <option value="L">L</option>
                  <option value="M">M</option>
                  <option value="Q">Q</option>
                  <option value="H">H</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dark Color
                </label>
                <input
                  type="color"
                  value={colorDark}
                  onChange={(e) => setColorDark(e.target.value)}
                  className="w-full h-10 p-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Light Color
                </label>
                <input
                  type="color"
                  value={colorLight}
                  onChange={(e) => setColorLight(e.target.value)}
                  className="w-full h-10 p-1 border rounded"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={generate}
                className="px-4 py-2 bg-blue-600 text-white rounded shadow"
              >
                Generate
              </button>
              <button
                onClick={downloadPNG}
                className="px-4 py-2 bg-green-600 text-white rounded shadow"
              >
                Download PNG
              </button>
              <button
                onClick={downloadSVG}
                className="px-4 py-2 bg-indigo-600 text-white rounded shadow"
              >
                Download SVG
              </button>
              <button
                onClick={copyPngToClipboard}
                className="px-4 py-2 bg-gray-700 text-white rounded shadow"
              >
                Copy PNG
              </button>
            </div>
          </div>

          {/* QR Display */}
          <div className="bg-gray-50 rounded p-4 flex flex-col items-center">
            {pngDataUrl ? (
              <img
                src={pngDataUrl}
                alt="QR Code"
                className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] object-contain"
              />
            ) : (
              <div className="text-sm text-gray-500">
                QR preview will appear here
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <hr className="my-6" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          <button onClick={clearHistory} className="text-sm text-red-600">
            Clear
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {history.length === 0 && (
            <div className="text-sm text-gray-500">No saved QR codes yet.</div>
          )}
          {history.map((item) => (
            <div
              key={item.id}
              className="border rounded p-2 bg-white flex flex-col"
            >
              <img
                src={item.pngDataUrl}
                alt={item.text}
                className="w-full h-40 object-contain mb-2"
              />
              <div className="text-xs text-gray-700 truncate">{item.text}</div>
              <div className="text-xs text-gray-400">
                {new Date(item.generatedAt).toLocaleString()}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => useHistoryItem(item)}
                  className="text-sm px-2 py-1 border rounded"
                >
                  Use
                </button>
                <a
                  href={item.pngDataUrl}
                  download={`qr-${item.id}.png`}
                  className="text-sm px-2 py-1 border rounded"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
