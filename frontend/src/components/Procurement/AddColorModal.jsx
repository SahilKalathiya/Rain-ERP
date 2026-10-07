import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * HSV to HEX conversion helper
 */
function hsvToHex(h, s, v) {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const val = Math.max(0, Math.min(100, v)) / 100;
  const f = (n, k = (n + h / 60) % 6) => val - val * sat * Math.max(Math.min(k, 4 - k, 1), 0);
  const rgb = [f(5), f(3), f(1)].map((x) => Math.round(x * 255));
  return '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * HEX to HSV conversion helper
 */
function hexToHsv(hexStr) {
  let clean = (hexStr || '').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return { h: 0, s: 100, v: 100 };
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

/**
 * Auto-detect color category based on Hue and Saturation/Lightness
 */
function detectCategory(hex) {
  const { h, s, v } = hexToHsv(hex);
  if (s < 12 || v < 15 || (v > 92 && s < 15)) return 'Neutral';
  if (h >= 345 || h <= 15) return 'Red';
  if (h > 15 && h <= 45) return 'Red'; // Rust/Orange
  if (h > 45 && h <= 70) return 'Yellow';
  if (h > 70 && h <= 165) return 'Green';
  if (h > 165 && h <= 255) return 'Blue';
  if (h > 255 && h <= 315) return 'Purple';
  return 'Red';
}

const PRESET_SWATCHES = [
  '#000000',
  '#FFFFFF',
  '#001F54',
  '#800000',
  '#5C2424',
  '#B7410E',
  '#808000',
  '#008080',
  '#F5F5DC',
  '#FFFFE0',
  '#808080',
  '#36454F'
];

/**
 * AddColorModal - Matches Client Reference (Image 2)
 * Features:
 * - 2D Saturation / Value interactive color gradient canvas
 * - Rainbow Hue slider
 * - Swatch box + Hex code input
 * - Native dropper / Fabric image sampler (EyeDropper API + File picker)
 * - Quick Select color swatches
 * - Color Name * & Pantone Code inputs
 */
import { initialColors } from '../../data/procurementData';

const PRESET_COLOR_DETAILS = {
  '#000000': { name: 'Black', pantone: '19-4008 TCX' },
  '#FFFFFF': { name: 'White', pantone: '11-0601 TCX' },
  '#001F54': { name: 'Navy Blue', pantone: '19-4029 TCX' },
  '#800000': { name: 'Maroon', pantone: '19-1528 TCX' },
  '#5C2424': { name: 'Dark Brown', pantone: '19-1220 TCX' },
  '#B7410E': { name: 'Rust', pantone: '18-1442 TCX' },
  '#808000': { name: 'Olive', pantone: '18-0527 TCX' },
  '#008080': { name: 'Teal', pantone: '19-4535 TCX' },
  '#F5F5DC': { name: 'Beige', pantone: '12-0806 TCX' },
  '#FFFFE0': { name: 'Light Ivory', pantone: '11-0604 TCX' },
  '#808080': { name: 'Grey', pantone: '17-4402 TCX' },
  '#36454F': { name: 'Charcoal', pantone: '19-4104 TCX' }
};

export default function AddColorModal({ initialColor = null, colors = [], onSave, onClose }) {
  const initHex = initialColor?.hex || '#000000';
  const initHsv = hexToHsv(initHex);

  const [hue, setHue] = useState(initHsv.h);
  const [sat, setSat] = useState(initHsv.s);
  const [val, setVal] = useState(initHsv.v);
  const [hexInput, setHexInput] = useState(initHex);

  // Master colors lookup map
  const allMasterColors = useMemo(() => {
    let local = [];
    try {
      const s = localStorage.getItem('raindrop_colors_v1');
      if (s) local = JSON.parse(s);
    } catch (e) {}
    const list = [...(colors || []), ...local, ...initialColors];
    const map = new Map();
    for (const c of list) {
      if (c && c.hex) {
        const key = c.hex.toLowerCase();
        if (!map.has(key)) map.set(key, c);
      }
    }
    return Array.from(map.values());
  }, [colors]);

  const findColorMatch = (hexStr) => {
    if (!hexStr) return null;
    const clean = hexStr.toUpperCase().trim();
    if (PRESET_COLOR_DETAILS[clean]) {
      return PRESET_COLOR_DETAILS[clean];
    }
    const found = allMasterColors.find((c) => c?.hex?.toUpperCase() === clean);
    if (found) return found;

    // Find nearest match
    if (clean.length === 7) {
      const r1 = parseInt(clean.slice(1, 3), 16);
      const g1 = parseInt(clean.slice(3, 5), 16);
      const b1 = parseInt(clean.slice(5, 7), 16);
      let closest = null;
      let minDiff = Infinity;
      for (const c of allMasterColors) {
        if (!c?.hex || c.hex.length < 7) continue;
        const r2 = parseInt(c.hex.slice(1, 3), 16);
        const g2 = parseInt(c.hex.slice(3, 5), 16);
        const b2 = parseInt(c.hex.slice(5, 7), 16);
        const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
        if (dist < minDiff) {
          minDiff = dist;
          closest = c;
        }
      }
      if (closest && minDiff <= 30) return closest;
    }
    return null;
  };

  const initialMatched = initialColor || findColorMatch(initHex);
  const [colorName, setColorName] = useState(initialMatched?.name || '');
  const [pantoneCode, setPantoneCode] = useState(initialMatched?.pantone || '');
  const [isUserEditedName, setIsUserEditedName] = useState(Boolean(initialColor?.name));
  const [isUserEditedPantone, setIsUserEditedPantone] = useState(Boolean(initialColor?.pantone));
  const [category, setCategory] = useState(initialColor?.category || detectCategory(initHex));
  const [errorMessage, setErrorMessage] = useState('');

  const [isSamplingImage, setIsSamplingImage] = useState(false);
  const [fabricImgSrc, setFabricImgSrc] = useState(null);

  const satValRef = useRef(null);
  const hueSliderRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingSatVal = useRef(false);
  const isDraggingHue = useRef(false);

  // Sync hex when HSV changes
  useEffect(() => {
    const computedHex = hsvToHex(hue, sat, val);
    setHexInput(computedHex);
    if (!initialColor) {
      setCategory(detectCategory(computedHex));
      // Auto-suggest name only if user has NOT manually customized the name
      if (!isUserEditedName) {
        const matched = findColorMatch(computedHex);
        if (matched) {
          setColorName(matched.name);
          if (!isUserEditedPantone && matched.pantone) {
            setPantoneCode(matched.pantone);
          }
        }
      }
    }
  }, [hue, sat, val]);

  // Handle manual Hex typing
  const handleHexInputChange = (e) => {
    let valStr = e.target.value.toUpperCase();
    if (!valStr.startsWith('#')) valStr = '#' + valStr;
    setHexInput(valStr);

    if (/^#[0-9A-F]{6}$/i.test(valStr)) {
      const parsedHsv = hexToHsv(valStr);
      setHue(parsedHsv.h);
      setSat(parsedHsv.s);
      setVal(parsedHsv.v);
      setCategory(detectCategory(valStr));
      if (!isUserEditedName) {
        const matched = findColorMatch(valStr);
        if (matched) {
          setColorName(matched.name || '');
          if (!isUserEditedPantone) setPantoneCode(matched.pantone || '');
        }
      }
    }
  };

  // Quick Select click
  const handleQuickSelect = (swatchHex) => {
    const parsed = hexToHsv(swatchHex);
    setHue(parsed.h);
    setSat(parsed.s);
    setVal(parsed.v);
    setHexInput(swatchHex.toUpperCase());
    setCategory(detectCategory(swatchHex));

    // Fill name & code for the selected preset swatch
    const matched = findColorMatch(swatchHex);
    if (matched) {
      setColorName(matched.name || '');
      setPantoneCode(matched.pantone || '');
      setIsUserEditedName(false);
      setIsUserEditedPantone(false);
    }
  };

  // Saturation / Value drag handler
  const updateSatValFromEvent = (e) => {
    if (!satValRef.current) return;
    const rect = satValRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    setSat(s);
    setVal(v);
  };

  // Hue drag handler
  const updateHueFromEvent = (e) => {
    if (!hueSliderRef.current) return;
    const rect = hueSliderRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const h = Math.round((x / rect.width) * 360) % 360;
    setHue(h);
  };

  // Global mousemove/mouseup listeners for smooth dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSatVal.current) updateSatValFromEvent(e);
      if (isDraggingHue.current) updateHueFromEvent(e);
    };

    const handleMouseUp = () => {
      isDraggingSatVal.current = false;
      isDraggingHue.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  // EyeDropper API (Native browser eyedropper)
  const handlePickFromImageOrScreen = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          handleQuickSelect(result.sRGBHex);
          return;
        }
      } catch (err) {
        // User cancelled or unsupported
      }
    }
    // Fallback: trigger file upload to sample from fabric image
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFabricImageUploaded = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setFabricImgSrc(loadEvt.target.result);
        setIsSamplingImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas sampler from uploaded fabric photo
  useEffect(() => {
    if (fabricImgSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = fabricImgSrc;
    }
  }, [fabricImgSrc, isSamplingImage]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex =
      '#' +
      [pixel[0], pixel[1], pixel[2]]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    handleQuickSelect(hex);
    setIsSamplingImage(false);
  };

  const handleSave = (e) => {
    e?.preventDefault();
    if (!colorName.trim()) {
      setErrorMessage('Please enter a color name.');
      return;
    }

    const finalHex = /^#[0-9A-F]{6}$/i.test(hexInput) ? hexInput : hsvToHex(hue, sat, val);
    const newColor = {
      id: initialColor?.id || `CLR-${Date.now().toString().slice(-4)}`,
      name: colorName.trim(),
      hex: finalHex,
      pantone: pantoneCode.trim(),
      category: category || detectCategory(finalHex)
    };

    if (onSave) {
      onSave(newColor);
    }
    if (onClose) {
      onClose(newColor);
    }
  };

  const currentComputedHex = hsvToHex(hue, sat, val);

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        zIndex: 1065
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div
          className="modal-content border-0 shadow-2xl"
          style={{ borderRadius: '16px', overflow: 'hidden' }}
        >
          {/* MODAL HEADER */}
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-center justify-content-between">
            <h5 className="modal-title fw-bold text-dark fs-18 mb-0">
              {initialColor ? 'Edit Color' : 'Add New Color'}
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px', color: '#64748b' }}
              onClick={() => onClose && onClose(null)}
            >
              <i className="ti ti-x fs-16"></i>
            </button>
          </div>

          {/* MODAL BODY */}
          <div className="modal-body px-4 pt-3 pb-3">
            {errorMessage && (
              <div className="alert alert-danger py-2 px-3 fs-12 mb-3 rounded-3">
                {errorMessage}
              </div>
            )}

            {/* PICK COLOR LABEL */}
            <label className="form-label fs-13 fw-semibold text-secondary mb-2">
              Pick Color <span className="text-danger">*</span>
            </label>

            {/* COLOR PICKER CONTAINER (Matching Image 2) */}
            <div className="d-flex gap-3 align-items-start mb-3">
              {/* Left / Center: 2D Saturation/Value Palette + Hue Slider */}
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                {/* 2D Canvas Area */}
                <div
                  ref={satValRef}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '150px',
                    borderRadius: '10px',
                    backgroundColor: `hsl(${hue}, 100%, 50%)`,
                    cursor: 'crosshair',
                    userSelect: 'none',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 1px rgba(0,0,0,0.2)'
                  }}
                  onMouseDown={(e) => {
                    isDraggingSatVal.current = true;
                    updateSatValFromEvent(e);
                  }}
                  onTouchStart={(e) => {
                    isDraggingSatVal.current = true;
                    updateSatValFromEvent(e);
                  }}
                >
                  {/* White horizontal gradient overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to right, #ffffff, rgba(255,255,255,0))'
                    }}
                  />
                  {/* Black vertical gradient overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to top, #000000, rgba(0,0,0,0))'
                    }}
                  />

                  {/* Circular handle cursor */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${sat}%`,
                      top: `${100 - val}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid #ffffff',
                      boxShadow: '0 0 4px rgba(0,0,0,0.6)',
                      pointerEvents: 'none',
                      backgroundColor: currentComputedHex
                    }}
                  />
                </div>

                {/* Hue rainbow slider */}
                <div
                  ref={hueSliderRef}
                  className="mt-2"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '16px',
                    borderRadius: '8px',
                    background:
                      'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => {
                    isDraggingHue.current = true;
                    updateHueFromEvent(e);
                  }}
                  onTouchStart={(e) => {
                    isDraggingHue.current = true;
                    updateHueFromEvent(e);
                  }}
                >
                  {/* Hue handle circle */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(hue / 360) * 100}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid #ffffff',
                      backgroundColor: `hsl(${hue}, 100%, 50%)`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Right Side: Swatch & Hex Code Input */}
              <div className="d-flex flex-column align-items-center" style={{ width: '84px' }}>
                <div
                  title="Click to use native color picker"
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '12px',
                    backgroundColor: currentComputedHex,
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Invisible native color input to trigger system picker if clicked */}
                  <input
                    type="color"
                    value={/^#[0-9A-F]{6}$/i.test(hexInput) ? hexInput : '#000000'}
                    onChange={(e) => handleQuickSelect(e.target.value)}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                <div className="mt-2 w-100">
                  <input
                    type="text"
                    maxLength={7}
                    value={hexInput}
                    onChange={handleHexInputChange}
                    className="form-control form-control-sm text-center fw-bold fs-12 px-1"
                    style={{
                      borderRadius: '8px',
                      borderColor: '#cbd5e1',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px'
                    }}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            {/* PICK FROM FABRIC IMAGE */}
            <div className="mb-3">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none fs-13 fw-medium d-inline-flex align-items-center gap-1.5"
                style={{ color: '#4f46e5' }}
                onClick={handlePickFromImageOrScreen}
              >
                <i className="ti ti-color-picker fs-16"></i>
                <span>Pick from Fabric Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFabricImageUploaded}
              />

              {/* Uploaded image sampler view if active */}
              {isSamplingImage && fabricImgSrc && (
                <div className="mt-2 p-2 border rounded-3 bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fs-11 text-muted fw-semibold">
                      Click anywhere on the image to sample:
                    </span>
                    <button
                      type="button"
                      className="btn-close btn-close-sm"
                      onClick={() => setIsSamplingImage(false)}
                    ></button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '120px',
                      cursor: 'crosshair',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1'
                    }}
                  />
                </div>
              )}
            </div>

            {/* QUICK SELECT SWATCHES */}
            <div className="mb-3">
              <label className="form-label fs-13 fw-semibold text-secondary mb-1.5">
                Quick Select
              </label>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {PRESET_SWATCHES.map((swatchHex, idx) => {
                  const isSelected = hexInput.toUpperCase() === swatchHex.toUpperCase();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickSelect(swatchHex)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: swatchHex,
                        border: isSelected ? '3px solid #4f46e5' : '1px solid #cbd5e1',
                        padding: 0,
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.15)' : 'none',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 0 2px #c7d2fe' : '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                      title={swatchHex}
                    />
                  );
                })}
              </div>
            </div>

            {/* COLOR NAME * */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fs-13 fw-semibold text-secondary mb-0">
                  Color Name <span className="text-danger">*</span>
                </label>
                {colorName && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none fs-11 fw-semibold"
                    style={{ color: '#4f46e5' }}
                    onClick={() => {
                      setColorName('');
                      setIsUserEditedName(true);
                    }}
                    title="Clear to enter custom color name"
                  >
                    Change / Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                className="form-control form-control-sm fs-13 py-2 bg-white"
                style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                placeholder="e.g., Navy Blue, Rust, Maroon"
                value={colorName}
                onChange={(e) => {
                  setColorName(e.target.value);
                  setIsUserEditedName(true);
                  if (errorMessage) setErrorMessage('');
                }}
                required
              />
            </div>

            {/* PANTONE CODE */}
            <div className="mb-2">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fs-13 fw-semibold text-secondary mb-0">
                  Pantone Code
                </label>
                {pantoneCode && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none fs-11 fw-semibold"
                    style={{ color: '#4f46e5' }}
                    onClick={() => {
                      setPantoneCode('');
                      setIsUserEditedPantone(true);
                    }}
                    title="Clear to enter custom pantone code"
                  >
                    Change / Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                className="form-control form-control-sm fs-13 py-2 bg-white"
                style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                placeholder="e.g., 19-4052 TCX"
                value={pantoneCode}
                onChange={(e) => {
                  setPantoneCode(e.target.value);
                  setIsUserEditedPantone(true);
                }}
              />
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="modal-footer border-top pt-3 pb-3 px-4 d-flex align-items-center justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-link text-secondary text-decoration-none fs-13 fw-medium px-3"
              onClick={() => onClose && onClose(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn text-white fs-13 fw-semibold px-4 py-2"
              style={{
                backgroundColor: '#4f46e5',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)'
              }}
              onClick={handleSave}
            >
              {initialColor ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
