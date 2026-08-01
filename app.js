// ==========================================
// 1. APP STATE & GUIDED STEPS
// ==========================================
const STEPS = [
  {
    title: "1. Exposure & False Color Inspection",
    instruction: "Upload your shot and reference image. Toggle 'False Color Mode' to visually map exposure zones in IRE values.",
    action: "Exposure Mapping",
    tip: "Purple = Underexposed (<3 IRE), Green = Middle Gray (18% / ~42 IRE), Red = Blown Highlights (>100 IRE)."
  },
  {
    title: "2. Vectorscope & Skin Tone Alignment",
    instruction: "Check the 360° YUV Vectorscope. Ensure your subject's skin tones align with the standard 123° Skin Tone Indicator Line.",
    action: "Hue Calibration",
    tip: "Human skin tone (regardless of ethnicity) falls precisely along the I-bar line between Red and Yellow on a vectorscope."
  },
  {
    title: "3. Split-Screen Mood Matching & LUT Export",
    instruction: "Compare channel distribution deltas against your reference frame, then export a generated 3D .cube LUT.",
    action: "Grade Export",
    tip: "A 3D LUT maps RGB input values to target RGB output values, allowing instant grade transfer into DaVinci/Premiere."
  }
];

let currentStep = 0;
let primaryImageData = null;
let referenceImageData = null;
let isFalseColorActive = false;

// ==========================================
// 2. CORE RENDERING ENGINE
// ==========================================
function renderApp() {
  const root = document.getElementById("root");
  if (!root) return;

  const step = STEPS[currentStep];

  root.innerHTML = `
    <div class="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
      
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold text-cyan-400">${step.title}</h1>
        <span class="bg-cyan-950 text-cyan-300 text-xs px-3 py-1 rounded-full font-bold">
          ${step.action}
        </span>
      </div>

      <!-- Dual Dropzone (Split-Screen Ingestion) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Primary Shot Dropzone -->
        <div 
          id="dropzonePrimary"
          class="border-2 border-dashed border-gray-700 hover:border-cyan-400 rounded-xl p-4 text-center transition-all cursor-pointer bg-gray-950/50"
        >
          <input type="file" id="filePrimary" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-cyan-400 uppercase tracking-wide">📸 1. Your Shot</p>
          <p class="text-xs text-gray-400 mt-1">Drag & drop or click to upload</p>
        </div>

        <!-- Reference Shot Dropzone -->
        <div 
          id="dropzoneRef"
          class="border-2 border-dashed border-gray-700 hover:border-purple-400 rounded-xl p-4 text-center transition-all cursor-pointer bg-gray-950/50"
        >
          <input type="file" id="fileRef" accept="image/*" class="hidden" />
          <p class="text-xs font-bold text-purple-400 uppercase tracking-wide">🎬 2. Reference Frame (Target Look)</p>
          <p class="text-xs text-gray-400 mt-1">Drag & drop movie screenshot / reference</p>
        </div>

      </div>

      <!-- Controls Toolbar -->
      <div id="toolbar" class="flex flex-wrap gap-2 items-center justify-between border-t border-b border-gray-800 py-3">
        <button 
          id="toggleFalseColor" 
          class="px-3 py-1.5 ${isFalseColorActive ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-300'} hover:bg-cyan-600 rounded-lg text-xs font-semibold border border-gray-700 transition"
        >
          🎨 ${isFalseColorActive ? 'Disable False Color' : 'Toggle False Color Mode'}
        </button>

        <button 
          id="exportLUT" 
          class="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-semibold border border-purple-500/30 transition"
        >
          💾 Export 3D .CUBE LUT
        </button>
      </div>

      <!-- Canvas Display Suite -->
      <div id="previewContainer" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Primary View -->
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center">
          <p class="text-xs text-gray-400 mb-2 font-semibold">YOUR SHOT</p>
          <canvas id="primaryCanvas" class="max-w-full max-h-[180px] object-contain rounded-lg"></canvas>
        </div>

        <!-- Reference View -->
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center">
          <p class="text-xs text-purple-400 mb-2 font-semibold">REFERENCE LOOK</p>
          <canvas id="refCanvas" class="max-w-full max-h-[180px] object-contain rounded-lg"></canvas>
        </div>

        <!-- YUV Vectorscope View -->
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center">
          <p class="text-xs text-cyan-400 mb-2 font-semibold">360° YUV VECTORSCOPE</p>
          <canvas id="vectorscopeCanvas" width="180" height="180" class="w-[180px] h-[180px] bg-gray-950 rounded-full border border-gray-800"></canvas>
        </div>

      </div>

      <!-- Histograms Container -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800">
          <p class="text-xs text-gray-400 mb-1 font-semibold text-center">YOUR HISTOGRAM</p>
          <canvas id="primaryHist" width="256" height="100" class="w-full h-[100px] bg-gray-950 rounded border border-gray-800"></canvas>
        </div>
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800">
          <p class="text-xs text-purple-400 mb-1 font-semibold text-center">REFERENCE HISTOGRAM</p>
          <canvas id="refHist" width="256" height="100" class="w-full h-[100px] bg-gray-950 rounded border border-gray-800"></canvas>
        </div>
      </div>

      <!-- Live Pixel Critique & Delta Analysis Output -->
      <div id="critiqueBox" class="bg-gray-950 border border-gray-800 p-4 rounded-xl text-xs space-y-2">
        <p class="font-bold text-cyan-400">📊 Enterprise Diagnostic & Delta Analysis:</p>
        <div id="critiqueFeedback" class="text-gray-300 leading-relaxed">
          Upload images to trigger real-time delta matching and skin-tone analysis.
        </div>
      </div>

      <!-- Step Instructions & Tip -->
      <p class="text-sm text-gray-200">${step.instruction}</p>

      <div class="bg-gray-800/80 border-l-4 border-cyan-500 p-3 rounded text-xs text-gray-300">
        💡 <strong>Colorist Tip:</strong> ${step.tip}
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between pt-2">
        <button 
          id="prevBtn" 
          ${currentStep === 0 ? 'disabled' : ''} 
          class="px-4 py-2 bg-gray-800 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-700 transition"
        >
          Previous
        </button>
        <button 
          id="nextBtn" 
          ${currentStep === STEPS.length - 1 ? 'disabled' : ''} 
          class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-bold text-white disabled:opacity-30 transition"
        >
          Next Step
        </button>
      </div>
    </div>
  `;

  attachEventListeners();
  restoreCanvasState();
}

// ==========================================
// 3. FILE INGESTION & EVENT BINDINGS
// ==========================================
function attachEventListeners() {
  bindDropzone("dropzonePrimary", "filePrimary", (file) => processImageFile(file, 'primary'));
  bindDropzone("dropzoneRef", "fileRef", (file) => processImageFile(file, 'reference'));

  document.getElementById("toggleFalseColor").onclick = toggleFalseColorMode;
  document.getElementById("exportLUT").onclick = export3DLUT;

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentStep > 0) {
        currentStep--;
        requestAnimationFrame(() => renderApp());
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentStep < STEPS.length - 1) {
        currentStep++;
        requestAnimationFrame(() => renderApp());
      }
    };
  }
}

function bindDropzone(dropzoneId, inputId, callback) {
  const zone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  zone.onclick = () => input.click();
  zone.ondragover = (e) => { e.preventDefault(); zone.classList.add("border-cyan-400"); };
  zone.ondragleave = () => zone.classList.remove("border-cyan-400");
  zone.ondrop = (e) => {
    e.preventDefault();
    zone.classList.remove("border-cyan-400");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) callback(e.dataTransfer.files[0]);
  };
  input.onchange = (e) => {
    if (e.target.files && e.target.files[0]) callback(e.target.files[0]);
  };
}

// ==========================================
// 4. IMAGE PROCESSING & CANVAS RESTORATION
// ==========================================
function processImageFile(file, type) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvasId = type === 'primary' ? 'primaryCanvas' : 'refCanvas';
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      if (type === 'primary') {
        // Deep copy of raw data ensures pristine baseline regardless of transformations
        primaryImageData = { 
          img, 
          imageData, 
          rawData: new Uint8ClampedArray(imageData.data) 
        };
        isFalseColorActive = false; // Reset toggle on fresh upload
        drawHistogram(imageData, 'primaryHist');
        drawVectorscope(imageData);
      } else {
        referenceImageData = { img, imageData };
        drawHistogram(imageData, 'refHist');
      }

      runEnterpriseAnalysis();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function restoreCanvasState() {
  if (primaryImageData) {
    const canvas = document.getElementById('primaryCanvas');
    if (canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = primaryImageData.img.width;
      canvas.height = primaryImageData.img.height;
      
      if (isFalseColorActive) {
        applyFalseColorToCanvas(ctx, canvas.width, canvas.height);
      } else {
        ctx.putImageData(primaryImageData.imageData, 0, 0);
      }
      
      drawHistogram(primaryImageData.imageData, 'primaryHist');
      drawVectorscope(primaryImageData.imageData);
    }
  }

  if (referenceImageData) {
    const refCanvas = document.getElementById('refCanvas');
    if (refCanvas) {
      const ctx = refCanvas.getContext("2d");
      refCanvas.width = referenceImageData.img.width;
      refCanvas.height = referenceImageData.img.height;
      ctx.putImageData(referenceImageData.imageData, 0, 0);
      drawHistogram(referenceImageData.imageData, 'refHist');
    }
  }

  if (primaryImageData || referenceImageData) {
    runEnterpriseAnalysis();
  }
}

// ==========================================
// 5. FALSE COLOR ENGINE
// ==========================================
function toggleFalseColorMode() {
  if (!primaryImageData) return;

  const canvas = document.getElementById("primaryCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  isFalseColorActive = !isFalseColorActive;

  if (isFalseColorActive) {
    applyFalseColorToCanvas(ctx, canvas.width, canvas.height);
  } else {
    ctx.putImageData(primaryImageData.imageData, 0, 0);
  }

  // Update button visual state
  const btn = document.getElementById("toggleFalseColor");
  if (btn) {
    btn.className = `px-3 py-1.5 ${isFalseColorActive ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-cyan-300'} hover:bg-cyan-600 rounded-lg text-xs font-semibold border border-gray-700 transition`;
    btn.innerText = isFalseColorActive ? "🎨 Disable False Color" : "🎨 Toggle False Color Mode";
  }
}

function applyFalseColorToCanvas(ctx, width, height) {
  const imgData = ctx.createImageData(width, height);
  const targetData = imgData.data;
  const raw = primaryImageData.rawData;

  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i];
    const g = raw[i + 1];
    const b = raw[i + 2];
    
    // Luminance via Rec. 709 coefficients
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (luma >= 250) { // Clipped Highlights (>100 IRE) -> Red
      targetData[i] = 255; targetData[i + 1] = 0; targetData[i + 2] = 0;
    } else if (luma >= 100 && luma <= 115) { // Skin Tone High (~70 IRE) -> Pink
      targetData[i] = 255; targetData[i + 1] = 105; targetData[i + 2] = 180;
    } else if (luma >= 40 && luma <= 48) { // 18% Middle Gray (~42 IRE) -> Green
      targetData[i] = 0; targetData[i + 1] = 255; targetData[i + 2] = 0;
    } else if (luma <= 10) { // Crushed Shadows (<3 IRE) -> Purple
      targetData[i] = 128; targetData[i + 1] = 0; targetData[i + 2] = 128;
    } else { // Monochrome base
      targetData[i] = luma; targetData[i + 1] = luma; targetData[i + 2] = luma;
    }
    targetData[i + 3] = raw[i + 3]; // Preserve alpha channel
  }

  ctx.putImageData(imgData, 0, 0);
}

// ==========================================
// 6. 360° YUV VECTORSCOPE
// ==========================================
function drawVectorscope(imageData) {
  const canvas = document.getElementById("vectorscopeCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width; 
  const center = size / 2;
  const radius = center - 10;

  ctx.clearRect(0, 0, size, size);

  // Background ring
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Axis lines
  ctx.beginPath();
  ctx.moveTo(center, 5); ctx.lineTo(center, size - 5);
  ctx.moveTo(5, center); ctx.lineTo(size - 5, center);
  ctx.stroke();

  // 123° Skin Tone Target Line
  const skinAngle = (123 * Math.PI) / 180;
  ctx.strokeStyle = "#f59e0b"; 
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.lineTo(center + Math.cos(skinAngle) * radius, center - Math.sin(skinAngle) * radius);
  ctx.stroke();

  // Plotting pixel scatter with adaptive downsampling based on image size
  const pixels = imageData.data;
  const totalPixels = pixels.length / 4;
  const step = Math.max(4, Math.floor(totalPixels / 15000)) * 4; // Caps plot count to ~15,000 points

  ctx.fillStyle = "rgba(6, 182, 212, 0.35)";

  for (let i = 0; i < pixels.length; i += step) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // BT.601 YUV representation for vectorscope standard
    const u = -0.14713 * r - 0.28886 * g + 0.436 * b;
    const v = 0.615 * r - 0.51499 * g - 0.10001 * b;

    const x = center + (u * (radius / 128));
    const y = center - (v * (radius / 128));

    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

// ==========================================
// 7. HISTOGRAM ENGINE
// ==========================================
function drawHistogram(imageData, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  const pixels = imageData.data;
  const rBin = new Uint32Array(256);
  const gBin = new Uint32Array(256);
  const bBin = new Uint32Array(256);

  // Subsample every 4th pixel for UI speed
  for (let i = 0; i < pixels.length; i += 16) {
    rBin[pixels[i]]++;
    gBin[pixels[i + 1]]++;
    bBin[pixels[i + 2]]++;
  }

  let maxCount = 1;
  for (let i = 0; i < 256; i++) {
    if (rBin[i] > maxCount) maxCount = rBin[i];
    if (gBin[i] > maxCount) maxCount = gBin[i];
    if (bBin[i] > maxCount) maxCount = bBin[i];
  }

  ctx.clearRect(0, 0, width, height);

  const drawChannel = (bin, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x < 256; x++) {
      const barHeight = (bin[x] / maxCount) * height;
      ctx.lineTo(x, height - barHeight);
    }
    ctx.lineTo(256, height);
    ctx.closePath();
    ctx.fill();
  };

  ctx.globalCompositeOperation = "screen";
  drawChannel(rBin, "rgba(239, 68, 68, 0.5)");
  drawChannel(gBin, "rgba(34, 197, 94, 0.5)");
  drawChannel(bBin, "rgba(59, 130, 246, 0.5)");
  ctx.globalCompositeOperation = "source-over";
}

// ==========================================
// 8. DELTA ANALYSIS & MOOD MATCHING
// ==========================================
function runEnterpriseAnalysis() {
  const feedback = document.getElementById("critiqueFeedback");
  if (!feedback || !primaryImageData) return;

  let report = [];

  const pData = primaryImageData.rawData;
  let pLumaSum = 0;
  const sampleStep = 16;
  const sampleCount = pData.length / sampleStep;

  for (let i = 0; i < pData.length; i += sampleStep) {
    pLumaSum += (0.2126 * pData[i] + 0.7152 * pData[i + 1] + 0.0722 * pData[i + 2]);
  }
  const pAvgLuma = (pLumaSum / sampleCount).toFixed(1);

  report.push(`📸 <strong>Your Shot Avg Exposure:</strong> ${pAvgLuma} / 255 IRE.`);

  if (referenceImageData) {
    const rData = referenceImageData.imageData.data;
    let rLumaSum = 0;
    let rRedSum = 0, rBlueSum = 0;
    const rSampleCount = rData.length / sampleStep;
    
    for (let i = 0; i < rData.length; i += sampleStep) {
      rRedSum += rData[i];
      rBlueSum += rData[i + 2];
      rLumaSum += (0.2126 * rData[i] + 0.7152 * rData[i + 1] + 0.0722 * rData[i + 2]);
    }

    const rAvgLuma = (rLumaSum / rSampleCount).toFixed(1);
    const lumaDelta = (rAvgLuma - pAvgLuma).toFixed(1);

    if (Math.abs(lumaDelta) > 15) {
      const direction = lumaDelta > 0 ? "boost" : "reduce";
      report.push(`🎯 <strong>Luminance Delta Gap:</strong> Reference is ${Math.abs(lumaDelta)} units brighter. ${direction.toUpperCase()} exposure/offset to match target look.`);
    } else {
      report.push(`✅ <strong>Exposure Matched:</strong> Luminance closely matches your reference frame.`);
    }

    if (rRedSum > rBlueSum) {
      report.push(`🎨 <strong>Target Grade Mood:</strong> Reference relies on warm split-toning (Red/Orange bias). Push midtone wheels toward 60° Amber.`);
    } else {
      report.push(`🎨 <strong>Target Grade Mood:</strong> Reference skews cool/teal. Push shadow wheels toward 210° Cyan.`);
    }
  } else {
    report.push(`💡 <em>Upload a Reference Frame above to unlock Delta Matching & Mood Target Guidance.</em>`);
  }

  feedback.innerHTML = report.map(item => `<p class="mb-1">${item}</p>`).join("");
}

// ==========================================
// 9. 3D .CUBE LUT EXPORT ENGINE
// ==========================================
function export3DLUT() {
  if (!primaryImageData) {
    alert("Please upload an image first to generate a 3D LUT!");
    return;
  }

  const lutSize = 17;
  const lines = [`# Color Director Generated 3D LUT`, `LUT_3D_SIZE ${lutSize}`, ``];

  const pData = primaryImageData.rawData;
  let rSum = 0, gSum = 0, bSum = 0;
  const count = pData.length / 16;
  
  for (let i = 0; i < pData.length; i += 16) {
    rSum += pData[i]; gSum += pData[i + 1]; bSum += pData[i + 2];
  }
  
  const rMult = (rSum / count) / 128;
  const gMult = (gSum / count) / 128;
  const bMult = (bSum / count) / 128;

  for (let b = 0; b < lutSize; b++) {
    for (let g = 0; g < lutSize; g++) {
      for (let r = 0; r < lutSize; r++) {
        const rIn = r / (lutSize - 1);
        const gIn = g / (lutSize - 1);
        const bIn = b / (lutSize - 1);

        const rOut = Math.min(1.0, Math.max(0.0, rIn * (1.1 - (rMult - 1.0)))).toFixed(6);
        const gOut = Math.min(1.0, Math.max(0.0, gIn * (1.1 - (gMult - 1.0)))).toFixed(6);
        const bOut = Math.min(1.0, Math.max(0.0, bIn * (1.1 - (bMult - 1.0)))).toFixed(6);

        lines.push(`${rOut} ${gOut} ${bOut}`);
      }
    }
  }

  const blob = new Blob([lines.join('\n')], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Color_Director_Grade.cube";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 10. SELF-HEALING FAILSAFE
// ==========================================
try {
  renderApp();
} catch (err) {
  console.error("App error encountered:", err);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div class="p-6 bg-red-950/80 border border-red-500 rounded-2xl text-center text-white">
        <p class="font-bold text-red-400">Pipeline Recovered From Error</p>
        <p class="text-xs text-gray-300 mt-1 mb-4">${err.message}</p>
        <button onclick="location.reload()" class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold">
          Reload Engine
        </button>
      </div>
    `;
  }
}
