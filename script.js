// =====================================================
// FIXED Image to SVG Converter - WORKING VERSION
// GitHub Pages Ready - No Dependencies
// =====================================================

class ImageToSVGConverter {
    constructor() {
        this.currentImage = null;
        this.svgOutput = null;
        this.isProcessing = false;
        this.init();
    }

    init() {
        this.attachEvents();
        this.updateUI();
    }

    attachEvents() {
        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.loadImage(e));
        }

        // Convert button
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.convertToSVG());
        }

        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadSVG());
        }

        // Copy button
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copySVG());
        }
    }

    loadImage(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.src = img.src;
                    preview.style.display = 'block';
                }
                this.updateUI();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async convertToSVG() {
        if (!this.currentImage || this.isProcessing) return;

        this.isProcessing = true;
        const convertBtn = document.getElementById('convertBtn');
        const status = document.getElementById('status');
        
        if (convertBtn) convertBtn.disabled = true;
        if (status) status.textContent = 'Converting...';

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size (max 400px for performance)
            const maxSize = 400;
            let { width, height } = this.currentImage;
            
            if (width > height) {
                if (width > maxSize) height *= maxSize / width;
                width = maxSize;
            } else {
                if (height > maxSize) width *= maxSize / height;
                height = maxSize;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(this.currentImage, 0, 0, width, height);

            // Get image data and convert to SVG
            const imageData = ctx.getImageData(0, 0, width, height);
            const svg = this.imageDataToSVG(imageData, width, height);

            // Display results
            const svgOutput = document.getElementById('svgOutput');
            const svgPreview = document.getElementById('svgPreview');
            
            if (svgOutput) svgOutput.value = svg;
            if (svgPreview) {
                svgPreview.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
                svgPreview.style.display = 'block';
            }

            this.svgOutput = svg;
            this.updateUI();

        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Conversion failed. Please try a smaller image.');
        } finally {
            this.isProcessing = false;
            if (convertBtn) convertBtn.disabled = false;
            if (status) status.textContent = 'Ready';
        }
    }

    imageDataToSVG(imageData, width, height) {
        const data = imageData.data;
        const svg = [];

        // Simple posterization - group similar colors
        const paths = this.posterizeImage(data, width, height);

        svg.push(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`);
        
        // Add paths to SVG
        paths.forEach(path => {
            const color = `rgb(${path.color.r},${path.color.g},${path.color.b})`;
            svg.push(`<path d="${path.d}" fill="${color}" stroke="none"/>`);
        });

        // Add simple scanlines for better effect
        for (let y = 0; y < height; y += 20) {
            const alpha = 0.05;
            svg.push(`<rect y="${y}" width="${width}" height="1" fill="black" opacity="${alpha}"/>`);
        }

        svg.push('</svg>');
        return svg.join('');
    }

    posterizeImage(data, width, height) {
        const paths = [];
        const visited = new Set();
        
        // Sample every 8th pixel for performance
        for (let y = 0; y < height; y += 8) {
            for (let x = 0; x < width; x += 8) {
                const i = (Math.floor(y) * width + Math.floor(x)) * 4;
                if (i >= data.length) continue;

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Posterize colors (reduce to 8 levels per channel)
                const posterR = Math.floor(r / 32) * 32;
                const posterG = Math.floor(g / 32) * 32;
                const posterB = Math.floor(b / 32) * 32;

                const pathId = `${posterR}-${posterG}-${posterB}-${Math.floor(x/8)}-${Math.floor(y/8)}`;
                if (visited.has(pathId)) continue;
                visited.add(pathId);

                // Create simple rectangular path
                paths.push({
                    d: `M${x} ${y} h8 v8 h-8 Z`,
                    color: { r: posterR, g: posterG, b: posterB }
                });
            }
        }

        return paths;
    }

    downloadSVG() {
        if (!this.svgOutput) return;

        const blob = new Blob([this.svgOutput], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `image-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copySVG() {
        if (!this.svgOutput) return;

        navigator.clipboard.writeText(this.svgOutput).then(() => {
            const copyBtn = document.getElementById('copyBtn');
            if (copyBtn) {
                const original = copyBtn.textContent;
                copyBtn.textContent = '✅ Copied!';
                setTimeout(() => copyBtn.textContent = original, 2000);
            }
        });
    }

    updateUI() {
        const hasImage = !!this.currentImage;
        const hasSVG = !!this.svgOutput;
        const isProcessing = this.isProcessing;

        const convertBtn = document.getElementById('convertBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const copyBtn = document.getElementById('copyBtn');

        if (convertBtn) convertBtn.disabled = !hasImage || isProcessing;
        if (downloadBtn) downloadBtn.style.display = hasSVG ? 'inline-block' : 'none';
        if (copyBtn) copyBtn.style.display = hasSVG ? 'inline-block' : 'none';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ImageToSVGConverter();
    });
} else {
    new ImageToSVGConverter();
}
