// State Management
const state = {
    avatarImage: null, // Image object
    avatarSrc: null,   // Base64 or URL
    name: "Gabriel",
    handle: "@gabriel",
    theme: "white", // 'white' | 'black'
    position: "top", // 'top' | 'bottom'
    
    // Sliders
    avatarSize: 180,
    nameSize: 42,
    handleSize: 30,
    padding: 48,
    offset: 60,
    headerWidth: 85, // in percentage
    borderRadius: 24,

    // Export Options
    bitrate: 5000000,
    mimeType: "video/webm;codecs=vp9",

    // Videos Queue
    videos: [],
    currentRenderingIndex: null,
    isRendering: false,
    
    // Zoom & Watermark Masking
    zoomAntiMark: false,
    blurWatermarks: false,
    
    // Split Video & Chroma Key React Avatar
    isSplitActive: false,
    splitVideoElement: null,
    isChromaActive: false,
    chromaVideoElement: null,
    chromaSensitivity: 60,
    chromaScale: 25,
    chromaX: 50,
    chromaY: 75,
    
    // Split screen ratio & watermark
    splitRatio: 50,
    splitWatermarkText: "",
    splitWatermarkPos: "center",
    splitWatermarkOpacity: 40
};

// Default Avatar SVG Generator as a fallback
function generateDefaultAvatar() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, '#f59e0b'); // amber-500
    grad.addColorStop(1, '#ef4444'); // red-500
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 200, 200);

    // Profile symbol
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(100, 75, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(100, 175, 65, 0, Math.PI, true);
    ctx.fill();

    return canvas.toDataURL();
}

// Set initial default avatar
const defaultAvatarDataUrl = generateDefaultAvatar();
const defaultAvatarImg = new Image();
defaultAvatarImg.src = defaultAvatarDataUrl;
defaultAvatarImg.onload = () => {
    state.avatarImage = defaultAvatarImg;
    state.avatarSrc = defaultAvatarDataUrl;
    document.getElementById('avatarPreview').src = defaultAvatarDataUrl;
    document.getElementById('avatarPreview').classList.remove('hidden');
    document.getElementById('avatarIcon').classList.add('hidden');
    redrawPreview();
};

// UI Elements
const ui = {
    avatarInput: document.getElementById('avatarInput'),
    avatarPreview: document.getElementById('avatarPreview'),
    avatarIcon: document.getElementById('avatarIcon'),
    nameInput: document.getElementById('nameInput'),
    handleInput: document.getElementById('handleInput'),
    bgWhiteBtn: document.getElementById('bgWhiteBtn'),
    bgBlackBtn: document.getElementById('bgBlackBtn'),
    posTopBtn: document.getElementById('posTopBtn'),
    posBottomBtn: document.getElementById('posBottomBtn'),

    // Sliders
    avatarSizeInput: document.getElementById('avatarSize'),
    nameSizeInput: document.getElementById('nameSize'),
    handleSizeInput: document.getElementById('handleSize'),
    paddingInput: document.getElementById('paddingSize'),
    offsetInput: document.getElementById('offsetSize'),
    headerWidthInput: document.getElementById('headerWidth'),
    borderRadiusInput: document.getElementById('borderRadius'),

    // Slider values indicators
    avatarVal: document.getElementById('avatarVal'),
    nameVal: document.getElementById('nameVal'),
    handleVal: document.getElementById('handleVal'),
    paddingVal: document.getElementById('paddingVal'),
    offsetVal: document.getElementById('offsetVal'),
    widthVal: document.getElementById('widthVal'),
    radiusVal: document.getElementById('radiusVal'),

    // Canvas
    previewCanvas: document.getElementById('previewCanvas'),
    canvasPlaceholder: document.getElementById('canvasPlaceholder'),
    fpsCounter: document.getElementById('fpsCounter'),

    // Video uploads & queue
    videoFilesInput: document.getElementById('videoFilesInput'),
    dropZone: document.getElementById('dropZone'),
    videoQueueList: document.getElementById('videoQueueList'),
    emptyQueueMsg: document.getElementById('emptyQueueMsg'),
    queueCount: document.getElementById('queueCount'),
    renderAllBtn: document.getElementById('renderAllBtn'),
    bitrateSelect: document.getElementById('bitrateSelect'),
    formatSelect: document.getElementById('formatSelect'),
    hiddenVideoContainer: document.getElementById('hiddenVideoContainer'),
    
    // Toggles
    zoomToggle: document.getElementById('zoomToggle'),
    blurToggle: document.getElementById('blurToggle'),
    
    // Sidebar Tabs
    tabProfileBtn: document.getElementById('tabProfileBtn'),
    tabEffectsBtn: document.getElementById('tabEffectsBtn'),
    tabDownloadBtn: document.getElementById('tabDownloadBtn')
};

// Initialize lucide icons
lucide.createIcons();

// Helper to check standard WebM/MP4 support and populate formats
function checkMimeSupport() {
    const formats = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4",
        "video/webm"
    ];
    ui.formatSelect.innerHTML = "";
    let firstSupported = null;
    formats.forEach(f => {
        if (MediaRecorder.isTypeSupported(f)) {
            const opt = document.createElement('option');
            opt.value = f;
            let label = f;
            if (f.includes('vp9')) label = "WebM (VP9 - Excelente qualidade)";
            else if (f.includes('vp8')) label = "WebM (VP8 - Renderização rápida)";
            else if (f.includes('mp4')) label = "MP4 (Compatível)";
            opt.textContent = label;
            ui.formatSelect.appendChild(opt);
            if (!firstSupported) firstSupported = f;
        }
    });
    if (firstSupported) {
        state.mimeType = firstSupported;
        ui.formatSelect.value = firstSupported;
    }
}
checkMimeSupport();

// Add Event Listeners for inputs
ui.avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                state.avatarImage = img;
                state.avatarSrc = event.target.result;
                ui.avatarPreview.src = event.target.result;
                ui.avatarPreview.classList.remove('hidden');
                ui.avatarIcon.classList.add('hidden');
                redrawPreview();
            };
        };
        reader.readAsDataURL(file);
    }
});

ui.nameInput.addEventListener('input', (e) => {
    state.name = e.target.value;
    redrawPreview();
});

ui.handleInput.addEventListener('input', (e) => {
    state.handle = e.target.value;
    redrawPreview();
});

// Theme selection
ui.bgWhiteBtn.addEventListener('click', () => {
    state.theme = 'white';
    ui.bgWhiteBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all bg-white text-darkBg shadow";
    ui.bgBlackBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all text-gray-400 hover:text-white";
    redrawPreview();
});

ui.bgBlackBtn.addEventListener('click', () => {
    state.theme = 'black';
    ui.bgWhiteBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all text-gray-400 hover:text-white";
    ui.bgBlackBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all bg-darkCard text-white border border-darkBorder shadow";
    redrawPreview();
});

// Position selection
ui.posTopBtn.addEventListener('click', () => {
    state.position = 'top';
    ui.posTopBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all bg-amber-500/10 text-amber-400 border border-amber-500/20";
    ui.posBottomBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-gray-400 hover:text-white border border-transparent";
    redrawPreview();
});

ui.posBottomBtn.addEventListener('click', () => {
    state.position = 'bottom';
    ui.posTopBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-gray-400 hover:text-white border border-transparent";
    ui.posBottomBtn.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all bg-amber-500/10 text-amber-400 border border-amber-500/20";
    redrawPreview();
});

// Sliders and Indicators mapping
const sliders = [
    { el: ui.avatarSizeInput, valEl: ui.avatarVal, prop: 'avatarSize', suffix: 'px' },
    { el: ui.nameSizeInput, valEl: ui.nameVal, prop: 'nameSize', suffix: 'px' },
    { el: ui.handleSizeInput, valEl: ui.handleVal, prop: 'handleSize', suffix: 'px' },
    { el: ui.paddingInput, valEl: ui.paddingVal, prop: 'padding', suffix: 'px' },
    { el: ui.offsetInput, valEl: ui.offsetVal, prop: 'offset', suffix: 'px' },
    { el: ui.headerWidthInput, valEl: ui.widthVal, prop: 'headerWidth', suffix: '%' },
    { el: ui.borderRadiusInput, valEl: ui.radiusVal, prop: 'borderRadius', suffix: 'px' }
];

sliders.forEach(slider => {
    slider.el.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        state[slider.prop] = val;
        slider.valEl.textContent = val + slider.suffix;
        redrawPreview();
    });
});

ui.bitrateSelect.addEventListener('change', (e) => {
    state.bitrate = parseInt(e.target.value);
});

ui.formatSelect.addEventListener('change', (e) => {
    state.mimeType = e.target.value;
});

// Zoom & Blur Toggle listeners
ui.zoomToggle.addEventListener('change', (e) => {
    state.zoomAntiMark = e.target.checked;
    redrawPreview();
});

ui.blurToggle.addEventListener('change', (e) => {
    state.blurWatermarks = e.target.checked;
    redrawPreview();
});

// Drag & Drop Handlers

// --- NEW FEATURES: TABS, DOWNLOAD PREVIEW, SPLIT, CHROMA KEY ---

// Tabs Switching Logic
const tabs = [
    { btn: ui.tabProfileBtn, content: document.getElementById('tabProfileContent') },
    { btn: ui.tabEffectsBtn, content: document.getElementById('tabEffectsContent') },
    { btn: ui.tabDownloadBtn, content: document.getElementById('tabDownloadContent') }
];

tabs.forEach(tab => {
    tab.btn.addEventListener('click', () => {
        tabs.forEach(t => {
            t.content.classList.add('hidden');
            t.btn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-white";
        });
        tab.content.classList.remove('hidden');
        tab.btn.className = "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20";
    });
});

// Mass Download command preview
const downloadUrlInput = document.getElementById('downloadUrlInput');
const downloadCountInput = document.getElementById('downloadCountInput');
const commandPreview = document.getElementById('commandPreview');
const copyCommandBtn = document.getElementById('copyCommandBtn');

function updateCommandPreview() {
    const url = downloadUrlInput.value.trim() || "INSIRA_O_LINK_AQUI";
    const count = downloadCountInput.value;
    commandPreview.textContent = `python baixar.py -u "${url}" -c ${count}`;
}

downloadUrlInput.addEventListener('input', updateCommandPreview);
downloadCountInput.addEventListener('change', updateCommandPreview);

copyCommandBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(commandPreview.textContent).then(() => {
        const originalHtml = copyCommandBtn.innerHTML;
        copyCommandBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-emerald-450"></i>';
        lucide.createIcons();
        setTimeout(() => {
            copyCommandBtn.innerHTML = originalHtml;
            lucide.createIcons();
        }, 1500);
    });
});

// Split Video Layout toggling and file input
const splitToggle = document.getElementById('splitToggle');
const splitConfigSection = document.getElementById('splitConfigSection');
const splitVideoInput = document.getElementById('splitVideoInput');
const splitVideoPreview = document.getElementById('splitVideoPreview');

splitToggle.addEventListener('change', (e) => {
    state.isSplitActive = e.target.checked;
    if (state.isSplitActive) {
        splitConfigSection.classList.remove('hidden');
        if (state.splitVideoElement) {
            state.splitVideoElement.play().catch(() => {});
        }
    } else {
        splitConfigSection.classList.add('hidden');
        if (state.splitVideoElement) {
            state.splitVideoElement.pause();
        }
    }
    redrawPreview();
});

splitVideoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const objectUrl = URL.createObjectURL(file);
        splitVideoPreview.src = objectUrl;
        splitVideoPreview.classList.remove('hidden');
        splitVideoPreview.loop = true;
        splitVideoPreview.play().catch(() => {});
        
        state.splitVideoElement = splitVideoPreview;
        redrawPreview();
    }
});

// Split ratio & watermark listeners
const splitRatio = document.getElementById('splitRatio');
const splitRatioVal = document.getElementById('splitRatioVal');
const splitWatermarkText = document.getElementById('splitWatermarkText');
const splitWatermarkPos = document.getElementById('splitWatermarkPos');
const splitWatermarkOpacity = document.getElementById('splitWatermarkOpacity');
const splitWatermarkOpacityVal = document.getElementById('splitWatermarkOpacityVal');

splitRatio.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.splitRatio = val;
    splitRatioVal.textContent = val + "%";
    redrawPreview();
});

splitWatermarkText.addEventListener('input', (e) => {
    state.splitWatermarkText = e.target.value;
    redrawPreview();
});

splitWatermarkPos.addEventListener('change', (e) => {
    state.splitWatermarkPos = e.target.value;
    redrawPreview();
});

splitWatermarkOpacity.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.splitWatermarkOpacity = val;
    splitWatermarkOpacityVal.textContent = val + "%";
    redrawPreview();
});

// Chroma Key Reacting Avatar Toggle and controls
const chromaToggle = document.getElementById('chromaToggle');
const chromaConfigSection = document.getElementById('chromaConfigSection');
const chromaVideoInput = document.getElementById('chromaVideoInput');
const chromaVideoPreview = document.getElementById('chromaVideoPreview');
const chromaSensitivity = document.getElementById('chromaSensitivity');
const chromaScale = document.getElementById('chromaScale');
const chromaX = document.getElementById('chromaX');
const chromaY = document.getElementById('chromaY');

const chromaSensVal = document.getElementById('chromaSensVal');
const chromaScaleVal = document.getElementById('chromaScaleVal');
const chromaXVal = document.getElementById('chromaXVal');
const chromaYVal = document.getElementById('chromaYVal');

chromaToggle.addEventListener('change', (e) => {
    state.isChromaActive = e.target.checked;
    if (state.isChromaActive) {
        chromaConfigSection.classList.remove('hidden');
        if (state.chromaVideoElement) {
            state.chromaVideoElement.play().catch(() => {});
        }
    } else {
        chromaConfigSection.classList.add('hidden');
        if (state.chromaVideoElement) {
            state.chromaVideoElement.pause();
        }
    }
    redrawPreview();
});

chromaVideoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const objectUrl = URL.createObjectURL(file);
        chromaVideoPreview.src = objectUrl;
        chromaVideoPreview.classList.remove('hidden');
        chromaVideoPreview.loop = true;
        chromaVideoPreview.play().catch(() => {});
        
        state.chromaVideoElement = chromaVideoPreview;
        redrawPreview();
    }
});

chromaSensitivity.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.chromaSensitivity = val;
    chromaSensVal.textContent = val;
    redrawPreview();
});

chromaScale.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.chromaScale = val;
    chromaScaleVal.textContent = val + "%";
    redrawPreview();
});

chromaX.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.chromaX = val;
    chromaXVal.textContent = val + "%";
    redrawPreview();
});

chromaY.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.chromaY = val;
    chromaYVal.textContent = val + "%";
    redrawPreview();
});

// Helper offscreen canvas to extract pixels and run chroma key in JS
const chromaCanvas = document.createElement('canvas');
const chromaCtx = chromaCanvas.getContext('2d');


// Draw split screen watermark
function drawSplitWatermark(ctx, canvasWidth, canvasHeight, splitY) {
    if (!state.splitWatermarkText || state.splitWatermarkText.trim() === "") return;
    
    ctx.save();
    
    const text = state.splitWatermarkText.trim();
    const size = Math.round(canvasWidth * 0.035); // responsive text size based on canvas width
    ctx.font = `bold ${size}px Inter, sans-serif`;
    
    const textWidth = ctx.measureText(text).width;
    const paddingX = 24;
    const paddingY = 14;
    const badgeW = textWidth + (paddingX * 2);
    const badgeH = size + (paddingY * 2);
    const radius = 9999; // rounded capsule
    
    let x = (canvasWidth - badgeW) / 2; // Default center
    let y = splitY - (badgeH / 2); // Default center on partition line
    
    const margin = 40;
    
    if (state.splitWatermarkPos === 'top-left') {
        x = margin;
        y = margin;
    } else if (state.splitWatermarkPos === 'top-right') {
        x = canvasWidth - badgeW - margin;
        y = margin;
    } else if (state.splitWatermarkPos === 'bottom-left') {
        x = margin;
        y = canvasHeight - badgeH - margin;
    } else if (state.splitWatermarkPos === 'bottom-right') {
        x = canvasWidth - badgeW - margin;
        y = canvasHeight - badgeH - margin;
    }
    
    // Set opacity
    ctx.globalAlpha = state.splitWatermarkOpacity / 100;
    
    // Draw background capsule
    ctx.fillStyle = state.theme === 'white' ? '#000000' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, badgeW, badgeH, radius);
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = state.theme === 'white' ? '#ffffff' : '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + paddingX, y + badgeH / 2);
    
    ctx.restore();
}

function drawChromaAvatar(ctx, chromaVideo, canvasWidth, canvasHeight) {
    if (!chromaVideo || chromaVideo.paused || chromaVideo.ended || chromaVideo.videoWidth === 0) return;

    const vWidth = chromaVideo.videoWidth;
    const vHeight = chromaVideo.videoHeight;
    
    // Optimized resolution for pixel iteration
    const targetW = 280;
    const targetH = Math.round(targetW * (vHeight / vWidth));
    
    chromaCanvas.width = targetW;
    chromaCanvas.height = targetH;
    
    chromaCtx.drawImage(chromaVideo, 0, 0, targetW, targetH);
    
    const imgData = chromaCtx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    const sensitivity = state.chromaSensitivity;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        // Green chroma key: check if green component is dominant and higher than a threshold
        if (g > 80 && g > r * 1.2 && g > b * 1.2) {
            data[i+3] = 0; // alpha to transparent
        }
    }
    
    chromaCtx.putImageData(imgData, 0, 0);

    const finalScale = (state.chromaScale / 100) * canvasWidth;
    const drawW = finalScale;
    const drawH = drawW * (vHeight / vWidth);

    const drawX = (state.chromaX / 100) * canvasWidth - (drawW / 2);
    const drawY = (state.chromaY / 100) * canvasHeight - (drawH / 2);

    ctx.drawImage(chromaCanvas, drawX, drawY, drawW, drawH);
}


ui.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    ui.dropZone.classList.add('border-amber-500', 'bg-amber-500/5');
});

ui.dropZone.addEventListener('dragleave', () => {
    ui.dropZone.classList.remove('border-amber-500', 'bg-amber-500/5');
});

ui.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    ui.dropZone.classList.remove('border-amber-500', 'bg-amber-500/5');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    addVideosToQueue(files);
});

ui.dropZone.addEventListener('click', () => {
    ui.videoFilesInput.click();
});

ui.videoFilesInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('video/'));
    addVideosToQueue(files);
    ui.videoFilesInput.value = ""; // Reset input
});

// Function to handle video queue loading
function addVideosToQueue(files) {
    if (files.length === 0) return;

    files.forEach(file => {
        const videoId = 'vid_' + Math.random().toString(36).substr(2, 9);
        const objectUrl = URL.createObjectURL(file);
        
        const videoEl = document.createElement('video');
        videoEl.src = objectUrl;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.preload = "auto";
        ui.hiddenVideoContainer.appendChild(videoEl);

        const videoItem = {
            id: videoId,
            file: file,
            objectUrl: objectUrl,
            element: videoEl,
            status: 'pending',
            progress: 0,
            duration: 0
        };

        // Get metadata
        videoEl.onloadedmetadata = () => {
            videoItem.duration = videoEl.duration;
            updateQueueUI();
            
            // If it's the first video loaded, set it as the preview source
            if (state.videos.length > 0 && state.videos[0].id === videoId) {
                ui.canvasPlaceholder.classList.add('opacity-0');
                setTimeout(() => ui.canvasPlaceholder.classList.add('hidden'), 300);
                
                // Play and pause to load the first frame
                videoEl.currentTime = 0.1;
            }
        };

        videoEl.seeked = () => {
            if (state.videos[0] && state.videos[0].id === videoId && !state.isRendering) {
                redrawPreview();
            }
        };

        state.videos.push(videoItem);
    });

    updateQueueUI();
}

// Update the Queue UI elements
function updateQueueUI() {
    if (state.videos.length === 0) {
        ui.emptyQueueMsg.classList.remove('hidden');
        ui.renderAllBtn.disabled = true;
        ui.queueCount.textContent = "0 vídeos";
        ui.videoQueueList.innerHTML = "";
        return;
    }

    ui.emptyQueueMsg.classList.add('hidden');
    ui.renderAllBtn.disabled = false;
    ui.queueCount.textContent = `${state.videos.length} vídeo(s)`;

    // Keep existing items, just render their statuses dynamically
    ui.videoQueueList.innerHTML = "";
    state.videos.forEach((video, idx) => {
        const item = document.createElement('div');
        item.className = "flex flex-col bg-darkCard border border-darkBorder rounded-xl p-3.5 transition-all relative overflow-hidden";
        
        let statusBadge = "";
        let progressPercent = "";
        let borderHighlight = "border-darkBorder";
        let actionsHtml = "";

        if (video.status === 'pending') {
            statusBadge = `<span class="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[10px] font-bold">Fila</span>`;
            actionsHtml = `
                <button onclick="removeVideo('${video.id}')" class="text-gray-500 hover:text-red-400 transition-colors p-1" title="Remover">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
        } else if (video.status === 'rendering') {
            borderHighlight = "border-amber-500/50 shadow-md shadow-amber-500/5";
            statusBadge = `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold animate-pulse flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>Processando</span>`;
            progressPercent = `<span class="text-xs font-mono font-bold text-amber-400">${Math.round(video.progress)}%</span>`;
            actionsHtml = `<span class="text-xs text-gray-500 animate-pulse">Renderizando...</span>`;
        } else if (video.status === 'done') {
            borderHighlight = "border-emerald-500/30 bg-emerald-500/[0.02]";
            statusBadge = `<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i>Concluído</span>`;
            actionsHtml = `
                <button onclick="downloadRendered('${video.id}')" class="text-emerald-400 hover:text-emerald-300 transition-colors p-1 flex items-center gap-1.5 font-bold text-xs" title="Baixar Novamente">
                    <i data-lucide="download" class="w-4 h-4"></i> Salvar
                </button>
            `;
        } else if (video.status === 'error') {
            borderHighlight = "border-red-500/30 bg-red-500/[0.02]";
            statusBadge = `<span class="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3 h-3"></i>Erro</span>`;
            actionsHtml = `
                <button onclick="retryVideo('${video.id}')" class="text-amber-500 hover:text-amber-400 transition-colors p-1" title="Tentar Novamente">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                </button>
            `;
        }

        item.className = `flex flex-col bg-darkCard border ${borderHighlight} rounded-xl p-3.5 transition-all relative overflow-hidden`;

        // Duration formatted
        const min = Math.floor(video.duration / 60);
        const sec = Math.floor(video.duration % 60);
        const durationFormatted = `${min}:${sec < 10 ? '0' : ''}${sec}`;

        item.innerHTML = `
            <div class="flex items-center justify-between gap-3 z-10">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-10 h-10 rounded-lg bg-gray-950 flex items-center justify-center text-gray-500 border border-darkBorder flex-shrink-0">
                        <i data-lucide="film" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <div class="overflow-hidden">
                        <h4 class="text-xs font-bold text-gray-200 truncate pr-4">${video.file.name}</h4>
                        <p class="text-[10px] text-gray-500 font-medium mt-0.5">${(video.file.size / (1024 * 1024)).toFixed(2)} MB • ${durationFormatted}s</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    ${statusBadge}
                    ${actionsHtml}
                </div>
            </div>
            
            <!-- Progress Bar -->
            ${video.status === 'rendering' ? `
                <div class="w-full bg-gray-950 rounded-full h-1.5 mt-3 overflow-hidden border border-darkBorder">
                    <div class="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-100" style="width: ${video.progress}%"></div>
                </div>
                <div class="flex justify-between items-center mt-1.5 text-[10px] text-gray-500">
                    <span>Processando quadros...</span>
                    ${progressPercent}
                </div>
            ` : ''}
        `;
        ui.videoQueueList.appendChild(item);
    });

    lucide.createIcons();
}

// Global functions exposed to window for inline onclick attributes
window.removeVideo = function(id) {
    const idx = state.videos.findIndex(v => v.id === id);
    if (idx !== -1) {
        const [removed] = state.videos.splice(idx, 1);
        URL.revokeObjectURL(removed.objectUrl);
        removed.element.remove();
        updateQueueUI();
        redrawPreview();
    }
};

window.downloadRendered = function(id) {
    const video = state.videos.find(v => v.id === id);
    if (video && video.blobUrl) {
        const a = document.createElement('a');
        a.href = video.blobUrl;
        a.download = `viral-${video.file.name.replace(/\.[^/.]+$/, "")}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

window.retryVideo = function(id) {
    const video = state.videos.find(v => v.id === id);
    if (video) {
        video.status = 'pending';
        video.progress = 0;
        updateQueueUI();
    }
};


// Draw watermark mask pills (glassmorphism/blur effect)
function drawBlurMasks(ctx, canvasWidth, canvasHeight) {
    ctx.save();
    
    // Top-left watermark mask area (approx)
    const tlX = canvasWidth * 0.05;
    const tlY = canvasHeight * 0.08;
    const maskW = canvasWidth * 0.22;
    const maskH = canvasHeight * 0.055;
    const radius = 24;

    // Bottom-right watermark mask area (approx)
    const brX = canvasWidth * 0.73;
    const brY = canvasHeight * 0.78;

    // Helper to draw frosted glass mask
    function drawFrostedPill(x, y, w, h) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.clip();
        
        ctx.fillStyle = state.theme === 'white' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = state.theme === 'white' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    drawFrostedPill(tlX, tlY, maskW, maskH);
    drawFrostedPill(brX, brY, maskW, maskH);

    ctx.restore();
}

// Render elements on Canvas
function drawHeaderOverlay(ctx, canvasWidth, canvasHeight) {
    // Save context
    ctx.save();

    // Box dimensions setup
    const targetPercentWidth = state.headerWidth / 100;
    const boxWidth = canvasWidth * targetPercentWidth;
    
    // Auto-calculate height based on elements
    const padding = state.padding;
    const avatarSize = state.avatarSize;
    const gap = 30; // space between avatar and text
    
    // Text metrics & dimensions
    ctx.font = `bold ${state.nameSize}px Inter, sans-serif`;
    const nameMetrics = ctx.measureText(state.name);
    const nameHeight = state.nameSize;
    
    ctx.font = `${state.handleSize}px Inter, sans-serif`;
    const handleMetrics = ctx.measureText(state.handle);
    const handleHeight = state.handleSize;
    
    const textBlockHeight = nameHeight + 12 + handleHeight;
    const boxContentHeight = Math.max(avatarSize, textBlockHeight);
    const boxHeight = boxContentHeight + (padding * 2);

    // Box coordinate positions
    const boxX = (canvasWidth - boxWidth) / 2;
    let boxY = state.offset; // top position

    if (state.position === 'bottom') {
        boxY = canvasHeight - boxHeight - state.offset;
    }

    // Draw box shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;

    // Draw main box background
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, state.borderRadius);
    ctx.fillStyle = state.theme === 'white' ? '#ffffff' : '#000000';
    ctx.fill();

    // Reset shadow for inner elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw avatar image
    const avatarX = boxX + padding;
    const avatarY = boxY + padding + (boxContentHeight - avatarSize) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();

    if (state.avatarImage && state.avatarImage.complete) {
        ctx.drawImage(state.avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    } else {
        // Fallback grey background circle
        ctx.fillStyle = '#e5e7eb';
        ctx.fill();
    }
    ctx.restore();

    // Draw texts
    const textX = avatarX + avatarSize + gap;
    const nameY = boxY + padding + (boxContentHeight - textBlockHeight) / 2 + nameHeight;
    const handleY = nameY + 14 + handleHeight;

    // Draw Name
    ctx.fillStyle = state.theme === 'white' ? '#0f172a' : '#ffffff';
    ctx.font = `bold ${state.nameSize}px Inter, system-ui, -apple-system, sans-serif`;
    ctx.fillText(state.name, textX, nameY);

    // Draw @Handle
    ctx.fillStyle = state.theme === 'white' ? '#64748b' : '#94a3b8';
    ctx.font = `500 ${state.handleSize}px Inter, system-ui, -apple-system, sans-serif`;
    ctx.fillText(state.handle, textX, handleY);

    ctx.restore();
}

// Redraw current preview frame
function redrawPreview() {
    const ctx = ui.previewCanvas.getContext('2d');
    const width = ui.previewCanvas.width;
    const height = ui.previewCanvas.height;

    // Clear Canvas
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, width, height);

    // Draw active video first frame/current playback frame if any loaded
    const activeVideo = state.videos.length > 0 ? state.videos[0] : null;
    if (activeVideo && activeVideo.element && activeVideo.duration > 0) {
        const video = activeVideo.element;
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;
        
        if (vWidth > 0 && vHeight > 0) {
            if (state.isSplitActive && state.splitVideoElement) {
                // DRAW SPLIT SCREEN WITH DYNAMIC RATIO
                const splitRatioDecimal = state.splitRatio / 100;
                const splitY = height * splitRatioDecimal;
                
                // 1. Draw TOP: main video
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, width, splitY);
                ctx.clip();
                
                let scale = Math.max(width / vWidth, splitY / vHeight);
                if (state.zoomAntiMark) scale *= 1.15;
                const x = (width - vWidth * scale) / 2;
                const y = (splitY - vHeight * scale) / 2;
                ctx.drawImage(video, x, y, vWidth * scale, vHeight * scale);
                ctx.restore();

                // 2. Draw BOTTOM: Satisfying video
                const splitVideo = state.splitVideoElement;
                if (splitVideo.videoWidth > 0 && splitVideo.videoHeight > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, splitY, width, height - splitY);
                    ctx.clip();
                    
                    let scaleB = Math.max(width / splitVideo.videoWidth, (height - splitY) / splitVideo.videoHeight);
                    const xB = (width - splitVideo.videoWidth * scaleB) / 2;
                    const yB = splitY + ((height - splitY) - splitVideo.videoHeight * scaleB) / 2;
                    ctx.drawImage(splitVideo, xB, yB, splitVideo.videoWidth * scaleB, splitVideo.videoHeight * scaleB);
                    ctx.restore();
                }

                // 3. Draw middle border line
                ctx.fillStyle = '#1f293d';
                ctx.fillRect(0, splitY - 4, width, 8);
                
                // 4. Draw Watermark
                drawSplitWatermark(ctx, width, height, splitY);
                
            } else {
                // DRAW SINGLE VIDEO FULL SCREEN
                let scale = Math.max(width / vWidth, height / vHeight);
                if (state.zoomAntiMark) {
                    scale *= 1.15; // 15% zoom
                }
                const x = (width - vWidth * scale) / 2;
                const y = (height - vHeight * scale) / 2;
                ctx.drawImage(video, x, y, vWidth * scale, vHeight * scale);
            }

            // Draw watermark masks if checked
            if (state.blurWatermarks) {
                drawBlurMasks(ctx, width, height);
            }
        }
    } else {
        // Draw a placeholder mockup background if no video is present
        // Draw dark vertical gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#111827');
        gradient.addColorStop(0.5, '#030712');
        gradient.addColorStop(1, '#111827');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw a simulated feed item details
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(100, 1000, 880, 4);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(100, 1050, 600, 30);
        ctx.fillRect(100, 1100, 450, 20);
        ctx.fillRect(100, 1135, 520, 20);
    }

    // Draw chroma key avatar overlay if active
    if (state.isChromaActive && state.chromaVideoElement) {
        drawChromaAvatar(ctx, state.chromaVideoElement, width, height);
    }

    // Draw header box overlay
    drawHeaderOverlay(ctx, width, height);
}

// Initial draw
redrawPreview();

// Active rendering loops & MediaRecorder configuration
async function renderSingleVideo(videoItem) {
    return new Promise((resolve, reject) => {
        videoItem.status = 'rendering';
        videoItem.progress = 0;
        updateQueueUI();

        const video = videoItem.element;
        video.currentTime = 0;
        video.muted = false;
        video.volume = 1.0;

        // Create an offline high-res rendering Canvas
        const renderCanvas = document.createElement('canvas');
        renderCanvas.width = 1080;
        renderCanvas.height = 1920;
        const ctx = renderCanvas.getContext('2d');

        const videoStream = renderCanvas.captureStream(30);
        const videoTrack = videoStream.getVideoTracks()[0];

        let mediaRecorder;
        const chunks = [];
        let audioCtx = null;
        let source = null;
        let dest = null;
        let combinedStream = null;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            dest = audioCtx.createMediaStreamDestination();
            source = audioCtx.createMediaElementSource(video);
            source.connect(dest);

            const audioTrack = dest.stream.getAudioTracks()[0];
            if (audioTrack) {
                combinedStream = new MediaStream([videoTrack, audioTrack]);
            } else {
                combinedStream = new MediaStream([videoTrack]);
            }

            const options = {
                mimeType: state.mimeType,
                videoBitsPerSecond: state.bitrate
            };

            mediaRecorder = new MediaRecorder(combinedStream, options);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                try { source.disconnect(); } catch(e) {}
                try { audioCtx.close(); } catch(e) {}
                try { if (state.isSplitActive && state.splitVideoElement) state.splitVideoElement.pause(); } catch(e) {}
                try { if (state.isChromaActive && state.chromaVideoElement) state.chromaVideoElement.pause(); } catch(e) {}

                const blob = new Blob(chunks, { type: state.mimeType });
                const blobUrl = URL.createObjectURL(blob);
                videoItem.blobUrl = blobUrl;
                videoItem.status = 'done';
                videoItem.progress = 100;
                
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `viral-${videoItem.file.name.replace(/\.[^/.]+$/, "")}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                updateQueueUI();
                resolve();
            };

            mediaRecorder.onerror = (e) => {
                cleanup(e.error || new Error("Erro na gravacao do MediaRecorder"));
            };

            function drawLoop() {
                if (video.paused || video.ended) {
                    if (mediaRecorder.state !== 'inactive') {
                        mediaRecorder.stop();
                    }
                    return;
                }

                videoItem.progress = (video.currentTime / video.duration) * 100;
                updateQueueUI();

                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
                
                const cWidth = renderCanvas.width;
                const cHeight = renderCanvas.height;
                const vWidth = video.videoWidth;
                const vHeight = video.videoHeight;

                if (vWidth > 0 && vHeight > 0) {
                    if (state.isSplitActive && state.splitVideoElement) {
                        // DRAW SPLIT SCREEN WITH DYNAMIC RATIO
                        const splitRatioDecimal = state.splitRatio / 100;
                        const splitY = cHeight * splitRatioDecimal;

                        // 1. Draw TOP: main video
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(0, 0, cWidth, splitY);
                        ctx.clip();
                        
                        let scale = Math.max(cWidth / vWidth, splitY / vHeight);
                        if (state.zoomAntiMark) scale *= 1.15;
                        const x = (cWidth - vWidth * scale) / 2;
                        const y = (splitY - vHeight * scale) / 2;
                        ctx.drawImage(video, x, y, vWidth * scale, vHeight * scale);
                        ctx.restore();

                        // 2. Draw BOTTOM: Satisfying video
                        const splitVideo = state.splitVideoElement;
                        if (splitVideo.videoWidth > 0 && splitVideo.videoHeight > 0) {
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(0, splitY, cWidth, cHeight - splitY);
                            ctx.clip();
                            
                            let scaleB = Math.max(cWidth / splitVideo.videoWidth, (cHeight - splitY) / splitVideo.videoHeight);
                            const xB = (cWidth - splitVideo.videoWidth * scaleB) / 2;
                            const yB = splitY + ((cHeight - splitY) - splitVideo.videoHeight * scaleB) / 2;
                            ctx.drawImage(splitVideo, xB, yB, splitVideo.videoWidth * scaleB, splitVideo.videoHeight * scaleB);
                            ctx.restore();
                        }

                        // 3. Draw middle border line
                        ctx.fillStyle = '#1f293d';
                        ctx.fillRect(0, splitY - 4, cWidth, 8);
                        
                        // 4. Draw Watermark
                        drawSplitWatermark(ctx, cWidth, cHeight, splitY);
                        
                    } else {
                        // DRAW SINGLE VIDEO FULL SCREEN
                        let scale = Math.max(cWidth / vWidth, cHeight / vHeight);
                        if (state.zoomAntiMark) {
                            scale *= 1.15; // 15% zoom
                        }
                        const x = (cWidth - vWidth * scale) / 2;
                        const y = (cHeight - vHeight * scale) / 2;
                        ctx.drawImage(video, x, y, vWidth * scale, vHeight * scale);
                    }

                    // Draw watermark masks if checked
                    if (state.blurWatermarks) {
                        drawBlurMasks(ctx, cWidth, cHeight);
                    }
                }

                // Draw chroma key avatar overlay if active
                if (state.isChromaActive && state.chromaVideoElement) {
                    drawChromaAvatar(ctx, state.chromaVideoElement, cWidth, cHeight);
                }

                drawHeaderOverlay(ctx, cWidth, cHeight);
                requestAnimationFrame(drawLoop);
            }

            function cleanup(error) {
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
                video.pause();
                try { if (state.isSplitActive && state.splitVideoElement) state.splitVideoElement.pause(); } catch(e) {}
                try { if (state.isChromaActive && state.chromaVideoElement) state.chromaVideoElement.pause(); } catch(e) {}
                videoItem.status = 'error';
                try { source.disconnect(); } catch(e) {}
                try { audioCtx.close(); } catch(e) {}
                updateQueueUI();
                reject(error || new Error("Render cancelado ou com erro"));
            }

            audioCtx.resume().then(() => {
                if (state.isSplitActive && state.splitVideoElement) {
                    state.splitVideoElement.currentTime = 0;
                    state.splitVideoElement.play().catch(() => {});
                }
                if (state.isChromaActive && state.chromaVideoElement) {
                    state.chromaVideoElement.currentTime = 0;
                    state.chromaVideoElement.play().catch(() => {});
                }
                video.play();
                mediaRecorder.start();
                requestAnimationFrame(drawLoop);
            });

        } catch (e) {
            videoItem.status = 'error';
            updateQueueUI();
            reject(e);
        }
    });
}

// Global batch rendering queue driver
async function renderAllVideos() {
    if (state.isRendering || state.videos.length === 0) return;

    state.isRendering = true;
    ui.renderAllBtn.disabled = true;
    ui.videoFilesInput.disabled = true;
    ui.dropZone.style.pointerEvents = 'none';

    for (let i = 0; i < state.videos.length; i++) {
        const video = state.videos[i];
        if (video.status === 'done') continue; // skip completed

        try {
            await renderSingleVideo(video);
        } catch (err) {
            console.error("Falha ao renderizar vídeo:", video.file.name, err);
            video.status = 'error';
            updateQueueUI();
        }
    }

    state.isRendering = false;
    ui.renderAllBtn.disabled = false;
    ui.videoFilesInput.disabled = false;
    ui.dropZone.style.pointerEvents = 'auto';
    updateQueueUI();
}

ui.renderAllBtn.addEventListener('click', renderAllVideos);

// Run continuous preview sync loop for the first video if it is playing
function previewLoop() {
    const firstVideo = state.videos[0];
    if (firstVideo && firstVideo.element && !firstVideo.element.paused && !state.isRendering) {
        redrawPreview();
    }
    requestAnimationFrame(previewLoop);
}
requestAnimationFrame(previewLoop);


// Trigger redraw when fonts are loaded
document.fonts.ready.then(() => {
    redrawPreview();
});


// ==========================================
// RIFASEGURA V2 MARKETING & AVATAR GENERATOR
// ==========================================

const rifaAvatars = {
    confeiteira: {
        name: "Maria Doces & Bolos",
        handle: "@mariadoces_oficial",
        emoji: "🍰",
        gradientStart: "#ec4899",
        gradientEnd: "#f43f5e",
        bio: "Maria da Silva, 34 anos, confeiteira e mãe de dois filhos. Usa rifas para sortear kits de batedeiras planetárias e cursos presenciais, complementando a renda do lar.",
        midjourney: "A professional, warm photography portrait of a 30-year-old Latina female pastry chef, smiling, wearing a clean white chef apron, holding a small cupcake, pastel bakery kitchen background, soft volumetric lighting, 8k resolution, photorealistic --ar 1:1",
        script: "🍰 CONFEITEIRA REVELOU: Como faturar R$ 5.000 extra com apenas uma batedeira!\n\nOi gente! Muita gente me pergunta como eu consigo comprar meus equipamentos caros. O segredo é que eu faço rifas dos meus kits de confeitaria no RifaSegura!\n\nÉ super simples, seguro e qualquer um pode participar por R$ 2. Clicando no link da minha bio você escolhe seus números. Vem ver como funciona!",
        wa: "Olá! 🍰 Lancei uma ação super especial: vou sortear uma Batedeira Planetária profissional + um Kit de Confeitos premium! O bilhete custa só R$ 2,50 e me ajuda a comprar novos ingredientes para as aulas. Quer garantir seus números da sorte? Clique aqui no link e escolha os seus: [SEU_LINK]"
    },
    mecanico: {
        name: "Julinho da Oficina",
        handle: "@julinho_mecanica",
        emoji: "🔧",
        gradientStart: "#3b82f6",
        gradientEnd: "#1d4ed8",
        bio: "Júlio César, 41 anos, mecânico e preparador de motores. Faz rifas de ferramentas automotivas de ponta (scanners, jogos de chave importados) e até carros antigos restaurados na oficina.",
        midjourney: "A professional, rugged portrait of a 40-year-old male mechanic with light grease on his face, smiling warmly, holding a chrome wrench, standing in front of a modern clean auto repair garage, cinematic lighting, photorealistic, 8k --ar 1:1",
        script: "🔧 SÓ QUEM É DA GRAXA SABE! Kit de chaves importadas por menos de um pastel!\n\nFala rapaziada da graxa! Hoje tô trazendo essa maleta de ferramentas profissional da Gedore.\n\nRifa rodando no RifaSegura, Pix cai direto e tudo automatizado. Custa R$ 3 a cota. Link tá fixado na bio, garante sua chance!",
        wa: "Fala meu amigo! 🔧 Acabei de liberar a nova rifa do kit de chaves profissionais Gedore de 150 peças. A cota está apenas R$ 3,00! É a chance de dar aquele upgrade nas suas ferramentas gastando quase nada. Acesse o link oficial para participar: [SEU_LINK]"
    },
    mestre_obras: {
        name: "Antônio Mestre de Obras",
        handle: "@antonio_mestreobra",
        emoji: "🧱",
        gradientStart: "#f97316",
        gradientEnd: "#ea580c",
        bio: "Antônio Marcos, 48 anos, construtor e mestre de obras. Realiza rifas de ferramentas de construção civil de alto valor, como betoneiras, marteletes e serras circulares.",
        midjourney: "A portrait of a 50-year-old Brazilian male construction worker, wearing a yellow hardhat and safety vest, smiling, construction site background with warm golden hour sunlight, photorealistic, 8k --ar 1:1",
        script: "🧱 MESTRE DE OBRAS REVELOU! Como ganhar um martelete Bosch por R$ 2!\n\nFala pessoal da obra! Esse martelete é o sonho de todo pedreiro. Liberei uma ação rápida na plataforma RifaSegura pra sortear ele zerinho na caixa.\n\nSegurança total e Pix automático. O link tá na bio, corre antes que acabe!",
        wa: "Olá, tudo bem? 🧱 Montei uma ação para sortear um Martelete Bosch Profissional novinho! Cada cota é apenas R$ 2,00. É uma ótima ferramenta para agilizar o serviço no dia a dia. Garanta seus números da sorte antes que as cotas acabem: [SEU_LINK]"
    },
    papelaria: {
        name: "Ana Cláudia Papelaria",
        handle: "@anaclaudia_papelaria",
        emoji: "✏️",
        gradientStart: "#a855f7",
        gradientEnd: "#d946ef",
        bio: "Ana Cláudia, 29 anos, designer e dona de papelaria criativa. Usa rifas para movimentar sua comunidade, sorteando planners de couro premium, iPads de estudo e kits gigantes de canetas importadas.",
        midjourney: "A bright, cheerful portrait of a 28-year-old creative woman with colored hair, smiling, holding a luxury leather planner and beautiful brush pens, pastel color stationery shop background, cute aesthetics, soft lighting, 8k --ar 1:1",
        script: "✏️ O KIT DE PAPELARIA DOS SONHOS! Olha o tamanho desse estojo da Stabilo!\n\nOi, amigas da papelaria! Eu decidi fazer uma ação especial para vocês: este kit completo com planner e estojo importado por R$ 1,50 a cota no RifaSegura.\n\nÉ tudo online e muito seguro. Clique no link da bio e garanta seu número!",
        wa: "Oi, tudo bem? ✏️ Preparei um sorteio incrível de um Kit de Organização Premium: inclui um Planner de Couro + 30 canetas Stabilo Boss! A cota é apenas R$ 1,50. Se quiser concorrer e me apoiar na loja, é só acessar o link: [SEU_LINK]"
    },
    artesa: {
        name: "Regina Artesanatos",
        handle: "@regina_artesantos",
        emoji: "🧶",
        gradientStart: "#10b981",
        gradientEnd: "#059669",
        bio: "Regina Souza, 53 anos, artesã especialista em crochê e macramê. Faz rifas de peças de decoração artesanal exclusivas de grande porte (tapetes gigantes, cortinas em macramê, enxovais de luxo).",
        midjourney: "A cozy, authentic portrait of a 55-year-old smiling woman knitting in her brightly lit, plant-filled living room, wearing glasses and a warm knit sweater, cozy craft room background, soft focus, photorealistic, 8k --ar 1:1",
        script: "🧶 ARTESANATO EXCLUSIVO POR R$ 2!\n\nOlá, minhas queridas! Esse tapete gigante de crochê demorou semanas para ficar pronto. Para que mais pessoas possam ter a chance de levá-lo para casa, criei uma rifa no RifaSegura.\n\nParticipe com apenas R$ 2. O link está na bio, venham ver!",
        wa: "Olá! 🧶 Acabei de abrir as cotas para o sorteio do meu novo Tapete de Crochê Gigante (2.5m). Uma peça única, feita com muito amor. Cada bilhete custa R$ 2,00. Venha prestigiar meu trabalho artesanal e concorrer: [SEU_LINK]"
    }
};

const rifaCarousels = {
    seguranca: {
        theme: "emerald",
        bgColor: "#080d16",
        ambientColor: "rgba(16, 185, 129, 0.15)",
        borderColor: "rgba(16, 185, 129, 0.2)",
        slides: [
            {
                emoji: "🛡️",
                title: "100% SEGURO & TRANSPARENTE",
                subtitle: "Como funciona a nossa plataforma de sorteios",
                text: "Todas as transações passam por criptografia de ponta a ponta. Sua compra é processada com a segurança do Mercado Pago."
            },
            {
                emoji: "⚡",
                title: "PAGAMENTO VIA PIX AUTOMÁTICO",
                subtitle: "Sem complicações na hora de pagar",
                text: "Você escolhe os números, paga com o QR Code Pix e seus números são validados e reservados na hora, sem precisar enviar comprovante."
            },
            {
                emoji: "🔮",
                title: "SORTEIOS PELA LOTERIA FEDERAL",
                subtitle: "Transparência auditada de verdade",
                text: "O resultado é baseado nos números oficiais da Loteria Federal. Sem chances de manipulação ou fraudes. Qualquer um pode auditar."
            },
            {
                emoji: "👉",
                title: "GARANTA JÁ SUAS COTAS",
                subtitle: "Participe com total tranquilidade",
                text: "Centenas de pessoas já ganharam na nossa plataforma. Clique no link da bio, escolha seus números e boa sorte!"
            }
        ]
    },
    como_participar: {
        theme: "orange",
        bgColor: "#0c0705",
        ambientColor: "rgba(249, 115, 22, 0.15)",
        borderColor: "rgba(249, 115, 22, 0.2)",
        slides: [
            {
                emoji: "🎁",
                title: "QUER GANHAR PRÊMIOS INCRÍVEIS?",
                subtitle: "Aprenda a participar em menos de 1 minuto",
                text: "Criamos um sistema super fácil para você concorrer aos melhores prêmios da internet com cotas que cabem no seu bolso."
            },
            {
                emoji: "1️⃣",
                title: "PASSO 1: ESCOLHA OS NÚMEROS",
                subtitle: "Selecione suas dezenas da sorte",
                text: "Acesse o link da nossa bio e navegue pela lista de números disponíveis. Você pode escolher quantos números quiser para aumentar suas chances."
            },
            {
                emoji: "2️⃣",
                title: "PASSO 2: FAÇA O PIX SEGURO",
                subtitle: "Confirmação em poucos segundos",
                text: "Copie o código Copia e Cola do Pix ou escaneie o QR Code. O sistema identifica seu pagamento e envia seus números na hora."
            },
            {
                emoji: "3️⃣",
                title: "PASSO 3: TORÇA BASTANTE!",
                subtitle: "O resultado sai logo em seguida",
                text: "Assim que todas as cotas forem vendidas, realizamos o sorteio pela Loteria Federal. O ganhador é avisado por WhatsApp. Participe!"
            }
        ]
    },
    ganhador: {
        theme: "green",
        bgColor: "#050907",
        ambientColor: "rgba(16, 185, 129, 0.15)",
        borderColor: "rgba(16, 185, 129, 0.2)",
        slides: [
            {
                emoji: "🏆",
                title: "MAIS UM GANHADOR REVELADO!",
                subtitle: "A sorte sorriu para alguém esta semana",
                text: "Nossos prêmios são entregues de verdade. Veja como é fácil ser o próximo sortudo a levar um super prêmio para casa!"
            },
            {
                emoji: "📱",
                title: "DE R$ 2 PARA UM IPHONE NOVO!",
                subtitle: "Ganhador da última ação de smartphones",
                text: '"Não achei que ganharia com apenas R$ 2 reais, mas confiei na Loteria Federal e fui sorteado!" - João S., vencedor do iPhone.'
            },
            {
                emoji: "🚚",
                title: "ENTREGA 100% GARANTIDA",
                subtitle: "Enviamos para todo o Brasil sem custo",
                text: "Seja prêmio físico ou transferência em dinheiro via Pix, fazemos a entrega rápida com fotos e vídeos documentando tudo."
            },
            {
                emoji: "🍀",
                title: "QUER SER O PRÓXIMO?",
                subtitle: "Sua chance está batendo na porta",
                text: "A próxima ação já está aberta e as cotas estão vendendo super rápido. Clique no link da bio e garanta seu número da sorte agora!"
            }
        ]
    },
    urgencia: {
        theme: "yellow",
        bgColor: "#0a0905",
        ambientColor: "rgba(245, 158, 11, 0.15)",
        borderColor: "rgba(245, 158, 11, 0.2)",
        slides: [
            {
                emoji: "🚨",
                title: "ÚLTIMAS COTAS DISPONÍVEIS!",
                subtitle: "O sorteio será realizado hoje!",
                text: "O tempo está acabando e mais de 90% das cotas já foram reservadas. Essa é sua última oportunidade de entrar na disputa."
            },
            {
                emoji: "⏳",
                title: "VAI FICAR SÓ OLHANDO?",
                subtitle: "Outras pessoas já garantiram seus números",
                text: "Se você deixar para depois, as cotas vão esgotar e você vai perder a chance de ganhar o prêmio principal por centavos."
            },
            {
                emoji: "🔥",
                title: "COTAS PROMOCIONAIS",
                subtitle: "Leve mais números por muito menos",
                text: "Aproveite nossos pacotes promocionais diretamente no checkout. Mais números significam chances exponenciais de ser sorteado."
            },
            {
                emoji: "⚡",
                title: "CLIQUE NO LINK DA BIO AGORA",
                subtitle: "Não corra o risco de ficar de fora",
                text: "Abra a bio do perfil, clique no link oficial do RifaSegura e finalize sua compra pelo Pix. Boa sorte!"
            }
        ]
    },
    clube: {
        theme: "purple",
        bgColor: "#08050d",
        ambientColor: "rgba(168, 85, 247, 0.15)",
        borderColor: "rgba(168, 85, 247, 0.2)",
        slides: [
            {
                emoji: "👑",
                title: "CLUBE DE BENEFÍCIOS RIFASEGURA",
                subtitle: "Vantagens exclusivas para compradores frequentes",
                text: "Ao participar de nossas rifas, você entra automaticamente para o nosso grupo VIP com sorteios gratuitos semanais."
            },
            {
                emoji: "💸",
                title: "SORTEIOS EXCLUSIVOS GRÁTIS",
                subtitle: "Mimos para quem apoia a página",
                text: "Toda semana realizamos rodadas de Pix de R$ 100 a R$ 500 exclusivas para quem comprou cotas na rifa ativa do mês."
            },
            {
                emoji: "💬",
                title: "GRUPO VIP NO WHATSAPP",
                subtitle: "Receba novidades e cotas antecipadas",
                text: "Participantes ativos recebem o link das novas rifas com 24h de antecedência para garantir os melhores números antes de todo mundo."
            },
            {
                emoji: "🚀",
                title: "QUER FAZER PARTE DO CLUBE?",
                subtitle: "Basta adquirir seu primeiro bilhete",
                text: "Qualquer compra ativa te dá acesso ao grupo. Acesse o link da bio, garanta sua cota e venha fazer parte da nossa comunidade!"
            }
        ]
    }
};

let currentRifaCarousel = 'seguranca';
let currentRifaSlide = 0;

function generateEmojiAvatar(emoji, gradientStart, gradientEnd) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, gradientStart || '#f59e0b');
    grad.addColorStop(1, gradientEnd || '#ef4444');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 200, 200);

    // Draw Emoji
    ctx.font = '100px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji || '✨', 100, 105);

    return canvas.toDataURL();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    for (let k = 0; k < lines.length; k++) {
        ctx.fillText(lines[k].trim(), x, y + (k * lineHeight));
    }
    return lines.length;
}

function drawCarouselSlide(canvas, slideIndex, carouselKey) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const carousel = rifaCarousels[carouselKey];
    if (!carousel) return;
    const slide = carousel.slides[slideIndex];
    if (!slide) return;

    // Clear and background
    ctx.fillStyle = carousel.bgColor || '#090d16';
    ctx.fillRect(0, 0, W, H);

    // Ambient glowing radial lights
    ctx.save();
    const glowGrad = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.8);
    glowGrad.addColorStop(0, carousel.ambientColor || 'rgba(16, 185, 129, 0.15)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const tlGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.5);
    tlGlow.addColorStop(0, carousel.ambientColor || 'rgba(16, 185, 129, 0.15)');
    tlGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tlGlow;
    ctx.fillRect(0, 0, W, H);

    const brGlow = ctx.createRadialGradient(W, H, 0, W, H, W * 0.5);
    brGlow.addColorStop(0, carousel.ambientColor || 'rgba(16, 185, 129, 0.15)');
    brGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = brGlow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Frosted glass card in center
    ctx.save();
    const cardX = W * 0.08;
    const cardY = H * 0.12;
    const cardW = W * 0.84;
    const cardH = H * 0.72;
    const cardRadius = W * 0.06;

    // Card shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;

    // Fill card background
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fillStyle = 'rgba(17, 23, 38, 0.65)';
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Card border
    ctx.strokeStyle = carousel.borderColor || 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = W * 0.005;
    ctx.stroke();
    ctx.restore();

    // Draw header/eyebrow
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = `bold ${Math.round(W * 0.03)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('RIFASEGURA PLATAFORMA', W / 2, cardY + (cardH * 0.06));
    ctx.restore();

    // Draw Emoji
    ctx.save();
    ctx.font = `${Math.round(W * 0.16)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(slide.emoji, W / 2, cardY + (cardH * 0.23));
    ctx.restore();

    // Draw Title
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = `extrabold ${Math.round(W * 0.052)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const titleLines = wrapText(ctx, slide.title, W / 2, cardY + (cardH * 0.38), cardW * 0.9, W * 0.06);
    ctx.restore();

    // Draw Subtitle
    ctx.save();
    let subColor = '#10b981';
    if (carousel.theme === 'emerald') subColor = '#10b981';
    else if (carousel.theme === 'orange') subColor = '#f97316';
    else if (carousel.theme === 'green') subColor = '#10b981';
    else if (carousel.theme === 'yellow') subColor = '#fbbf24';
    else if (carousel.theme === 'purple') subColor = '#a855f7';

    ctx.fillStyle = subColor;
    ctx.font = `bold ${Math.round(W * 0.038)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const titleOffset = titleLines * W * 0.065;
    const subY = cardY + (cardH * 0.38) + titleOffset;
    const subLines = wrapText(ctx, slide.subtitle, W / 2, subY, cardW * 0.9, W * 0.045);
    ctx.restore();

    // Draw main body text
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = `medium ${Math.round(W * 0.031)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const subOffset = subLines * W * 0.05;
    const textY = subY + subOffset + (W * 0.02);
    wrapText(ctx, slide.text, W / 2, textY, cardW * 0.88, W * 0.042);
    ctx.restore();

    // Draw dots
    ctx.save();
    const dotsCount = carousel.slides.length;
    const dotSpacing = W * 0.04;
    const dotSize = W * 0.015;
    const dotsWidth = (dotsCount - 1) * dotSpacing;
    const startDotX = (W - dotsWidth) / 2;
    const dotsY = cardY + cardH - (cardH * 0.08);

    for (let i = 0; i < dotsCount; i++) {
        ctx.beginPath();
        ctx.arc(startDotX + (i * dotSpacing), dotsY, dotSize / 2, 0, Math.PI * 2);
        if (i === slideIndex) {
            ctx.fillStyle = subColor;
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        }
        ctx.fill();
    }
    ctx.restore();

    // Draw Swipe indicator
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `bold ${Math.round(W * 0.032)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const isLastSlide = slideIndex === dotsCount - 1;
    const footerPrompt = isLastSlide ? '🔗 Link na Bio para participar!' : 'Arrastar pro lado ➡️';
    if (isLastSlide) {
        ctx.fillStyle = subColor;
    }
    ctx.fillText(footerPrompt, W / 2, H - (H * 0.04));
    ctx.restore();
}

function redrawRifaCarouselPreview() {
    const canvas = document.getElementById('rifaCarouselCanvas');
    if (!canvas) return;
    drawCarouselSlide(canvas, currentRifaSlide, currentRifaCarousel);
}

function downloadActiveRifaSlide() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1080;
    tempCanvas.height = 1350;
    
    drawCarouselSlide(tempCanvas, currentRifaSlide, currentRifaCarousel);
    
    const url = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `rifasegura_slide_${currentRifaCarousel}_${currentRifaSlide + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function selectRifaAvatar(avatarKey) {
    const avatar = rifaAvatars[avatarKey];
    if (!avatar) return;
    
    document.getElementById('rifaAvatarBio').textContent = avatar.bio;
    document.getElementById('rifaAvatarPrompt').textContent = avatar.midjourney;
    document.getElementById('rifaAvatarScript').textContent = avatar.script;
    document.getElementById('rifaAvatarWa').textContent = avatar.wa;
}

function applyRifaAvatarToEditor(avatarKey) {
    const avatar = rifaAvatars[avatarKey];
    if (!avatar) return;
    
    const emojiAvatarDataUrl = generateEmojiAvatar(avatar.emoji, avatar.gradientStart, avatar.gradientEnd);
    
    const img = new Image();
    img.src = emojiAvatarDataUrl;
    img.onload = () => {
        state.avatarImage = img;
        state.avatarSrc = emojiAvatarDataUrl;
        
        ui.avatarPreview.src = emojiAvatarDataUrl;
        ui.avatarPreview.classList.remove('hidden');
        ui.avatarIcon.classList.add('hidden');
        
        state.name = avatar.name;
        state.handle = avatar.handle;
        
        ui.nameInput.value = avatar.name;
        ui.handleInput.value = avatar.handle;
        
        redrawPreview();
        ui.tabProfileBtn.click();
    };
}

function setupRifaCopyButton(btnId, textElId, successMessage) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
        const text = document.getElementById(textElId).innerText || document.getElementById(textElId).textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> Copiado!`;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                lucide.createIcons();
            }, 2000);
        });
    });
}

function updateRifaCarouselControls() {
    const indicator = document.getElementById('slideIndicator');
    if (indicator) {
        const carousel = rifaCarousels[currentRifaCarousel];
        if (carousel) {
            indicator.textContent = `Slide ${currentRifaSlide + 1} de ${carousel.slides.length}`;
        }
    }
}

function initRifaSeguraPack() {
    const avatarSelect = document.getElementById('rifaAvatarSelect');
    if (avatarSelect) {
        avatarSelect.addEventListener('change', (e) => {
            selectRifaAvatar(e.target.value);
        });
        selectRifaAvatar(avatarSelect.value);
    }
    
    const applyBtn = document.getElementById('applyRifaAvatarBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            if (avatarSelect) {
                applyRifaAvatarToEditor(avatarSelect.value);
            }
        });
    }

    setupRifaCopyButton('copyPromptBtn', 'rifaAvatarPrompt', 'Prompt copiado!');
    setupRifaCopyButton('copyScriptBtn', 'rifaAvatarScript', 'Roteiro copiado!');
    setupRifaCopyButton('copyWaBtn', 'rifaAvatarWa', 'Mensagem copiada!');

    const carouselSelect = document.getElementById('rifaCarouselSelect');
    if (carouselSelect) {
        carouselSelect.addEventListener('change', (e) => {
            currentRifaCarousel = e.target.value;
            currentRifaSlide = 0;
            updateRifaCarouselControls();
            redrawRifaCarouselPreview();
        });
    }

    const prevBtn = document.getElementById('prevSlideBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const carousel = rifaCarousels[currentRifaCarousel];
            if (carousel) {
                currentRifaSlide = (currentRifaSlide - 1 + carousel.slides.length) % carousel.slides.length;
                updateRifaCarouselControls();
                redrawRifaCarouselPreview();
            }
        });
    }

    const nextBtn = document.getElementById('nextSlideBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const carousel = rifaCarousels[currentRifaCarousel];
            if (carousel) {
                currentRifaSlide = (currentRifaSlide + 1) % carousel.slides.length;
                updateRifaCarouselControls();
                redrawRifaCarouselPreview();
            }
        });
    }

    const downloadBtn = document.getElementById('downloadSlideBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            downloadActiveRifaSlide();
        });
    }

    updateRifaCarouselControls();
    redrawRifaCarouselPreview();
    lucide.createIcons();
}

// Start RifaSegura V2 Pack
initRifaSeguraPack();
