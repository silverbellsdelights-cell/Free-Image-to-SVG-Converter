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
    if (!currentImageData) return;
    const options = {
        colorsampling: 1,
        numberofcolors: +document.getElementById('colors').value,
        blurradius: +document.getElementById('blur').value,
        ltres: 0.5, qtres: 0.5,
        pathomit: 8, layerdifference: 16
    };
    ImageTracer.imageToSVG(currentImageData, options, svgData => {
        svgPreview.innerHTML = svgData;
        svgLink.href = 'data:image/svg+xml;base64,' + btoa(svgData);
        svgLink.style.display = 'inline-block';
        actions.style.display = 'block';
    });
});

downloadBtn.addEventListener('click', () => {
    svgLink.click();
});

['colors', 'blur'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
        document.getElementById(id + 'Val').textContent = e.target.value;
    });
});
