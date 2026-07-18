const INLINED_STYLE_PROPS = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-opacity',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'color',
  'text-anchor',
  'dominant-baseline',
  'paint-order',
];

export type CapturedImage = {
  dataUrl: string;
  width: number;
  height: number;
  format: 'JPEG' | 'PNG';
};

/**
 * Render an in-page SVG element to a JPEG dataUrl (compact, suitable for PDF embedding).
 * Forces a light-themed rendering so the image looks correct on the white PDF background.
 */
export async function captureSvgAsPng(svg: SVGElement, targetWidth = 900): Promise<CapturedImage> {
  const viewBox = svg.getAttribute('viewBox')?.split(/\s+/).map(Number);
  const vbW = viewBox?.[2] ?? svg.clientWidth ?? targetWidth;
  const vbH = viewBox?.[3] ?? svg.clientHeight ?? targetWidth * 0.6;
  const aspect = vbH / vbW;
  const width = targetWidth;
  const height = Math.round(targetWidth * aspect);

  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-theme', 'light');
  wrapper.style.cssText = 'position:fixed;left:-99999px;top:0;background:#ffffff;padding:0;margin:0;';
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const elements = [clone, ...Array.from(clone.querySelectorAll<SVGElement>('*'))];
    elements.forEach((el) => {
      if (!(el instanceof Element)) return;
      const computed = window.getComputedStyle(el);
      INLINED_STYLE_PROPS.forEach((prop) => {
        const value = computed.getPropertyValue(prop);
        if (value) (el as SVGElement).style.setProperty(prop, value);
      });
    });

    const serialized = new XMLSerializer().serializeToString(clone);
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized);

    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG snapshot'));
      img.src = svgUrl;
    });

    const scale = 1.5;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.82),
      width,
      height,
      format: 'JPEG',
    };
  } finally {
    document.body.removeChild(wrapper);
  }
}

export async function captureExport(id: string, targetWidth = 900): Promise<CapturedImage | undefined> {
  const svg = document.querySelector<SVGElement>(`svg[data-export-id="${id}"]`);
  if (!svg) return undefined;
  return captureSvgAsPng(svg, targetWidth);
}
