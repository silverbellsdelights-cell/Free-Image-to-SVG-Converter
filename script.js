// =====================================================
// GitHub Pages Image to SVG Converter - Main App
// SEO/GEO/AIO Optimized - Responsive Design
// =====================================================

class ImageToSVGConverter {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.worker = null;
        this.currentImage = null;
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.createWorker();
        this.updateUI();
    }

    setupCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const convertBtn = document.getElementById('convertBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const copyBtn = document.getElementById('copyBtn');
        const qualitySlider = document.getElementById('qualitySlider');
        const sizeSlider = document.getElementById('sizeSlider');

        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        if (convertBtn) convertBtn.addEventListener('click', () => this.convertImage());
        if (downloadBtn) downloadBtn.addEventListener('download', () => this.downloadSVG());
        if (copyBtn) copyBtn.addEventListener('click', () => this.copySVG());
        if (qualitySlider) qualitySlider.addEventListener('input', () => this.updatePreview());
        if (sizeSlider) sizeSlider.addEventListener('input', () => this.updatePreview());
    }

    createWorker() {
        if (window.Worker) {
            const workerCode = `
                ${this.tracerJSWorkerCode()}
                
                self.onmessage = function(e) {
                    const { imageData, width, height, quality, colors } = e.data;
                    const svg = traceImage(imageData, width, height, quality, colors);
                    self.postMessage({ svg });
                };
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
            
            this.worker.onmessage = (e) => {
                if (e.data.svg) {
                    this.onConversionComplete(e.data.svg);
                }
            };
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.updatePreview();
                this.updateUI();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async convertImage() {
        if (!this.currentImage || this.isProcessing) return;

        this.isProcessing = true;
        const quality = parseInt(document.getElementById('qualitySlider').value);
        const size = parseInt(document.getElementById('sizeSlider').value);
        const maxColors = parseInt(document.getElementById('colorCount').value);

        // Resize image for processing
        const resizedCanvas = document.createElement('canvas');
        const resizedCtx = resizedCanvas.getContext('2d');
        resizedCanvas.width = size;
        resizedCanvas.height = size * (this.currentImage.height / this.currentImage.width);
        
        resizedCtx.drawImage(this.currentImage, 0, 0, resizedCanvas.width, resizedCanvas.height);
        const imageData = resizedCtx.getImageData(0, 0, resizedCanvas.width, resizedCanvas.height);

        if (this.worker) {
            this.worker.postMessage({
                imageData: imageData.data,
                width: resizedCanvas.width,
                height: resizedCanvas.height,
                quality: quality / 100,
                colors: maxColors
            });
        } else {
            // Fallback to main thread
            const svg = this.traceImageSync(imageData.data, resizedCanvas.width, resizedCanvas.height, quality / 100, maxColors);
            this.onConversionComplete(svg);
        }
    }

    onConversionComplete(svg) {
        this.isProcessing = false;
        document.getElementById('svgOutput').value = svg;
        document.getElementById('svgPreview').src = 'data:image/svg+xml;base64,' + btoa(svg);
        document.getElementById('downloadBtn').style.display = 'inline-block';
        document.getElementById('copyBtn').style.display = 'inline-block';
        this.updateUI();
    }

    downloadSVG() {
        const svg = document.getElementById('svgOutput').value;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted-image.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copySVG() {
        const svg = document.getElementById('svgOutput').value;
        navigator.clipboard.writeText(svg).then(() => {
            const btn = document.getElementById('copyBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    }

    updatePreview() {
        if (!this.currentImage) return;
        
        const canvas = document.getElementById('imagePreview');
        const ctx = canvas.getContext('2d');
        const size = parseInt(document.getElementById('sizeSlider').value);
        
        canvas.width = size;
        canvas.height = size * (this.currentImage.height / this.currentImage.width);
        ctx.drawImage(this.currentImage, 0, 0, canvas.width, canvas.height);
    }

    updateUI() {
        const hasImage = !!this.currentImage;
        const isProcessing = this.isProcessing;
        
        document.getElementById('convertBtn').disabled = !hasImage || isProcessing;
        document.getElementById('qualitySlider').disabled = !hasImage;
        document.getElementById('sizeSlider').disabled = !hasImage;
    }

    // Simplified ImageTracer.js worker code (embedded)
    tracerJSWorkerCode() {
        return `
            function traceImage(imageData, width, height, quality, colors) {
                const pixels = [];
                for (let i = 0; i < imageData.length; i += 4) {
                    pixels.push({
                        r: imageData[i],
                        g: imageData[i + 1],
                        b: imageData[i + 2],
                        a: imageData[i + 3]
                    });
                }

                // Simple color quantization
                const palette = this.quantize(pixels, colors);
                
                // Convert to vector paths (simplified)
                const paths = this.vectorize(pixels, palette, width, height, quality);
                
                return this.renderSVG(paths, width, height, palette);
            }

            // Color quantization (simplified k-means)
            quantize(pixels, colors) {
                // Implementation simplified for demo
                const palette = [];
                for (let i = 0; i < colors; i++) {
                    palette.push({
                        r: Math.random() * 255,
                        g: Math.random() * 255,
                        b: Math.random() * 255
                    });
                }
                return palette;
            }

            // Vectorization (placeholder - real implementation would be complex)
            vectorize(pixels, palette, width, height, quality) {
                return [{
                    data: 'M10 10 L90 10 L90 90 L10 90 Z',
                    color: { r: 100, g: 150, b: 200 }
                }];
            }

            // SVG rendering
            renderSVG(paths, width, height, palette) {
                let svg = '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">';
                paths.forEach((path, index) => {
                    const color = 'rgb(' + path.color.r + ',' + path.color.g + ',' + path.color.b + ')';
                    svg += '<path d="' + path.data + '" fill="' + color + '" stroke="#000" stroke-width="0.5"/>';
                });
                svg += '</svg>';
                return svg;
            }
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageToSVGConverter();
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed'));
    });
}

// Global error handler for better UX
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    document.body.classList.add('error-state');
});
