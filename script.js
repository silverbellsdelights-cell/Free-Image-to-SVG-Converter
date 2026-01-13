// Image to SVG Converter - Complete Working Script
document.addEventListener('DOMContentLoaded', function() {
    
    // Elements
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const previewArea = document.getElementById('previewArea');
    const downloadArea = document.getElementById('downloadArea');
    const originalImg = document.getElementById('originalImg');
    const svgPreview = document.getElementById('svgPreview');
    const finalSvg = document.getElementById('finalSvg');
    const detailSlider = document.getElementById('detailSlider');
    const detailValue = document.getElementById('detailValue');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');

    let originalImageData = null;
    let currentSvg = null;
    let detailLevel = 5;

    // Update detail value display
    detailSlider.addEventListener('input', function() {
        detailValue.textContent = this.value;
        detailLevel = parseInt(this.value);
        if (originalImageData) {
            convertImage();
        }
    });

    // Browse button
    browseBtn.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);

    // Convert button
    convertBtn.addEventListener('click', convertImage);

    // Download button
    downloadBtn.addEventListener('click', downloadSvg);

    // Copy button
    copyBtn.addEventListener('click', copySvgCode);

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && isValidImage(file)) {
            loadImage(file);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && isValidImage(file)) {
            loadImage(file);
        }
    }

    function isValidImage(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type) && file.size < 10 * 1024 * 1024;
    }

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImg.src = e.target.result;
            uploadZone.style.display = 'none';
            previewArea.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    function convertImage() {
        if (!originalImageData) {
            loadOriginalImageData();
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = originalImg.naturalWidth;
        canvas.height = originalImg.naturalHeight;
        ctx.drawImage(originalImg, 0, 0);
        
        // Simple tracing algorithm
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const svgPaths = traceImage(imageData, detailLevel);
        currentSvg = createSvg(svgPaths, canvas.width, canvas.height);
        
        svgPreview.innerHTML = currentSvg;
        convertBtn.textContent = '✅ Converted!';
        convertBtn.disabled = true;
    }

    function loadOriginalImageData() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = originalImg.naturalWidth;
        canvas.height = originalImg.naturalHeight;
        ctx.drawImage(originalImg, 0, 0);
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        convertImage();
    }

    function traceImage(imageData, detail) {
        const paths = [];
        const { data, width, height } = imageData;
        const step = Math.max(1, 10 - detail);
        
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const i = (y * width + x) * 4;
                const r = data[i], g = data[i+1], b = data[i+2];
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                
                if (brightness < 128) {
                    paths.push({
                        x: x / width,
                        y: y / height,
                        color: `rgb(${r},${g},${b})`
                    });
                }
            }
        }
        return paths;
    }

    function createSvg(paths, width, height) {
        const colors = {};
        paths.forEach(p => {
            const colorKey = p.color;
            if (!colors[colorKey]) colors[colorKey] = [];
            colors[colorKey].push(p);
        });

        let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
`;
        
        Object.entries(colors).forEach(([color, points]) => {
            if (points.length > 10) {
                svg += `  <path fill="${color}" opacity="0.8" d="`;
                points.forEach((p, i) => {
                    const x = p.x * width;
                    const y = p.y * height;
                    if (i === 0) svg += `M ${x} ${y} `;
                    else svg += `L ${x} ${y} `;
                });
                svg += `Z" />
`;
            }
        });
        
        svg += `</svg>`;
        return svg;
    }

    function downloadSvg() {
        const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function copySvgCode() {
        navigator.clipboard.writeText(currentSvg).then(() => {
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => copyBtn.textContent = '📋 Copy SVG Code', 2000);
        });
    }
});
