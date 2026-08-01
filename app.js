// ==========================================
// 1. APP STATE & GUIDED STEPS
// ==========================================
const STEPS = [
  {
    title: "1. Upload & Inspect Scopes",
    instruction: "Drag & drop an image into the dropzone or click to select a file. Check your live RGB & Luminance histogram below.",
    action: "File Analysis",
    tip: "A healthy histogram shouldn't smash against the far-left (crushed shadows) or far-right (clipped highlights)."
  },
  {
    title: "2. Balance Exposure & Contrast",
    instruction: "Observe the Luminance curve (white). If the peak is shifted left, boost your Lift/Offset.",
    action: "Exposure Check",
    tip: "In DaVinci Resolve: Adjust primary wheels; In Premiere Pro: Lumetri -> Basic Correction."
  },
  {
    title: "3. Check Color Casts",
    instruction: "Compare Red, Green, and Blue peaks. If one color sits way further right, your shot has a color tint.",
    action: "Color Balance",
    tip: "Use Tint/Temperature sliders or primary color wheels to pull channel peaks back into alignment."
  }
];

let currentStep = 0;
let cachedImageData = null; // Memory cache to persist canvas analysis across step navigation

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

      <!-- Dropzone -->
      <div 
        id="dropzone"
        class="border-2 border-dashed border-gray-700 hover:border-cyan-400 rounded-xl p-6 text-center transition-all cursor-pointer bg-gray-950/50"
      >
        <input type="file" id="fileInput" accept="image/*" class="hidden" />
        <p class="text-sm font-medium text-gray-300">📁 Drag & Drop an image here, or <span class="text-cyan-400 underline">click to browse</span></p>
        <p class="text-xs text-gray-500 mt-1">Processed 100% locally inside your browser (Canvas API)</p>
      </div>

      <!-- Image Display & Histogram Grid -->
      <div id="previewContainer" class="${cachedImageData ? '' : 'hidden'} grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <!-- Image Canvas -->
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center justify-center">
          <p class="text-xs text-gray-400 mb-2 font-semibold">IMAGE PREVIEW</p>
          <canvas id="imageCanvas" class="max-w-full max-h-[220px] object-contain rounded-lg"></canvas>
        </div>

        <!-- Histogram Canvas -->
        <div class="bg-black/60 rounded-xl p-2 border border-gray-800 flex flex-col items-center justify-center">
          <div class="flex justify-between w-full px-2 mb-2 text-xs text-gray-400 font-semibold">
            <span>HISTOGRAM (0–255)</span>
            <span class="text-cyan-400">R / G / B / Luma</span>
          </div>
          <canvas id="histogramCanvas" width="256" height="150" class="w-full h-[150px] bg-gray-950 rounded border border-gray-800/80"></canvas>
        </div>
      </div>

      <!-- Live Pixel Critique Output -->
      <div id="critiqueBox" class="${cachedImageData ? '' : 'hidden'} bg-gray-950 border border-gray-800 p-4 rounded-xl text-xs space-y-2">
        <p class="font-bold text-cyan-400">📊 Pixel Diagnostics:</p>
        <div id="critiqueFeedback" class="text-gray-300 leading-relaxed"></div>
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

  // Restore canvas state if cached image exists
  if (cachedImageData) {
    restoreCachedCanvas();
  }
}

// ==========================================
// 3. FILE INGESTION & EVENT HANDLERS
// ==========================================
function attachEventListeners() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");

  if (!dropzone || !fileInput) return;

  dropzone.onclick = () => fileInput.click();

  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.classList.add("border-cyan-400", "bg-cyan-950/20");
  };

  dropzone.ondragleave = () => {
    dropzone.classList.remove("border-cyan-400", "bg-cyan-950/20");
  };

  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove("border-cyan-400", "bg-cyan-950/20");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  fileInput.onchange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentStep > 0) { currentStep--; renderApp(); }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentStep < STEPS.length - 1) { currentStep++; renderApp(); }
    };
  }
}

// ==========================================
// 4. CANVAS IMAGE LOADING & HISTOGRAM GENERATION
// ==========================================
function processFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Please upload a valid image file (JPG, PNG, WebP).");
    return;
  }

  const reader = new FileReader();

  reader.onerror = () => {
    console.error("Error reading file");
    alert("Failed to load image file.");
  };

  reader.onload = (event) => {
    const img = new Image();
    
    img.onerror = () => {
      alert("Invalid or corrupted image format.");
    };

    img.onload = () => {
      try {
        const imgCanvas = document.getElementById("imageCanvas");
        if (!imgCanvas) return;

        const ctx = imgCanvas.getContext("2d");
        
        imgCanvas.width = img.width;
        imgCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        cachedImageData = { img, imageData }; // Cache reference for re-renders

        generateAndDrawHistogram(imageData);

        document.getElementById("previewContainer")?.classList.remove("hidden");
        document.getElementById("critiqueBox")?.classList.remove("hidden");
      } catch (err) {
        console.error("Canvas context error:", err);
      }
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

function restoreCachedCanvas() {
  if (!cachedImageData) return;
  const imgCanvas = document.getElementById("imageCanvas");
  if (!imgCanvas) return;

  const ctx = imgCanvas.getContext("2d");
  imgCanvas.width = cachedImageData.img.width;
  imgCanvas.height = cachedImageData.img.height;
  ctx.drawImage(cachedImageData.img, 0, 0);

  generateAndDrawHistogram(cachedImageData.imageData);
}

function generateAndDrawHistogram(imageData) {
  if (!imageData || !imageData.data) return;

  const pixels = imageData.data;
  const numPixels = pixels.length / 4;

  const rBin = new Uint32Array(256);
  const gBin = new Uint32Array(256);
  const bBin = new Uint32Array(256);
  const lumaBin = new Uint32Array(256);

  let totalLuma = 0;
  const step = 4; // Sample every 4th pixel for speed

  for (let i = 0; i < pixels.length; i += 4 * step) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

    rBin[r]++;
    gBin[g]++;
    bBin[b]++;
    lumaBin[luma]++;

    totalLuma += luma;
  }

  let maxCount = 1; // Guard against division-by-zero
  for (let i = 0; i < 256; i++) {
    if (rBin[i] > maxCount) maxCount = rBin[i];
    if (gBin[i] > maxCount) maxCount = gBin[i];
    if (bBin[i] > maxCount) maxCount = bBin[i];
    if (lumaBin[i] > maxCount) maxCount = lumaBin[i];
  }

  const histCanvas = document.getElementById("histogramCanvas");
  if (!histCanvas) return;

  const ctx = histCanvas.getContext("2d");
  const width = histCanvas.width;
  const height = histCanvas.height;

  ctx.clearRect(0, 0, width, height);

  const drawChannel = (bin, color, compositeOperation) => {
    ctx.globalCompositeOperation = compositeOperation;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let x = 0; x < 256; x++) {
      const binValue = bin[x];
      const barHeight = (binValue / maxCount) * (height - 10);
      const y = height - barHeight;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(256, height);
    ctx.closePath();
    ctx.fill();
  };

  drawChannel(rBin, "rgba(239, 68, 68, 0.5)", "screen");
  drawChannel(gBin, "rgba(34, 197, 94, 0.5)", "screen");
  drawChannel(bBin, "rgba(59, 130, 246, 0.5)", "screen");
  drawChannel(lumaBin, "rgba(255, 255, 255, 0.4)", "lighter");

  const sampledCount = numPixels / step;
  const avgBrightness = (totalLuma / (sampledCount || 1)).toFixed(1);
  runDiagnosticCritique(avgBrightness, rBin, gBin, bBin);
}

// ==========================================
// 5. DIAGNOSTIC CRITIQUE ENGINE
// ==========================================
function runDiagnosticCritique(avgLuma, rBin, gBin, bBin) {
  const feedback = document.getElementById("critiqueFeedback");
  if (!feedback) return;

  let messages = [];

  if (avgLuma < 50) {
    messages.push("🔴 <strong>Heavy Underexposure:</strong> Image average brightness is low (" + avgLuma + "/255). Lift shadow values to preserve shadow detail.");
  } else if (avgLuma > 200) {
    messages.push("🔴 <strong>Highlight Clipping Hazard:</strong> Image average brightness is high (" + avgLuma + "/255). Pull back your Gain/Highlights.");
  } else {
    messages.push("🟢 <strong>Balanced Exposure:</strong> Average luminance sits nicely at " + avgLuma + "/255.");
  }

  const crushedShadows = rBin[0] + gBin[0] + bBin[0];
  const clippedHighlights = rBin[255] + gBin[255] + bBin[255];

  if (crushedShadows > 5000) {
    messages.push("⚠️ <strong>Crushed Blacks Detected:</strong> Data is piling up at value 0.");
  }
  if (clippedHighlights > 5000) {
    messages.push("⚠️ <strong>Clipped Highlights Detected:</strong> Data is peaking at value 255.");
  }

  feedback.innerHTML = messages.map(msg => `<p class="mb-1">${msg}</p>`).join("");
}

// ==========================================
// 6. SELF-HEALING FAILSAFE
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
