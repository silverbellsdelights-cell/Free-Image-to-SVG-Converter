const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const controls = document.getElementById('controls');
const convertBtn = document.getElementById('convertBtn');
const previews = document.getElementById('previews');
const actions = document.getElementById('actions');
const originalCanvas = document.getElementById('originalCanvas');
const svgPreview = document.getElementById('svgPreview');
const downloadBtn = document.getElementById('downloadBtn');
const svgLink = document.getElementById('svgLink');
let currentImageData = null;

uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFile);
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.background = '#F1F5F9'; });
uploadZone.addEventListener('dragleave', () => uploadZone.style.background = 'transparent');
uploadZone.addEventListener('drop', e => {
    e.preventDefault(); uploadZone.style.background = 'transparent';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile({ target: { files: [file] } });
});

function handleFile(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        alert('Please select a valid image under 5MB');
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const ctx = originalCanvas.getContext('2d');
            const maxSize = 600;
            let { width, height } = img;
            if (width > height) {
                if (width > maxSize) height *= maxSize / width, width = maxSize;
            } else {
                if (height > maxSize) width *= maxSize / height, height = maxSize;
            }
            originalCanvas.width = width; originalCanvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            currentImageData = ctx.getImageData(0, 0, width, height);
            controls.style.display = 'flex';
            previews.style.display = 'grid';
            actions.style.display = 'none';
            svgPreview.innerHTML = '';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

convertBtn.addEventListener('click', () => {
    if (!currentImageData || typeof ImageTracer === 'undefined') {
        alert('ImageTracer not loaded or no image. Check console.');
        return;
    }
    const options = {
        colorsampling: 1,
        numberofcolors: parseInt(document.getElementById('colors').value),
        blurradius: parseFloat(document.getElementById('blur').value),
        ltres: 1, qtres: 1,
        pathomit: 8, blurradius: 0,
        strokewidth: 1, scale: 1,
        roundcoords: 1, lcpr: 0,
        qcpr: 0, desc: 0
    };
    try {
        const svgData = ImageTracer.imagedataToSVG(currentImageData, options);  // Fixed: Synchronous API [page:1]
        svgPreview.innerHTML = svgData;
        svgLink.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);  // Fixed: Proper data URL
        svgLink.download = 'converted.svg';
        svgLink.style.display = 'inline-block';
        actions.style.display = 'block';
    } catch (err) {
        console.error('Tracing error:', err);
        alert('Conversion failed: ' + err.message);
    }
});

downloadBtn.addEventListener('click', () => svgLink.click());

['colors', 'blur'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
        document.getElementById(id + 'Val').textContent = e.target.value;
    });
});
