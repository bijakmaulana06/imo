import { readPsd } from 'ag-psd';
import fs from 'fs';

const buffer = fs.readFileSync('scratch/template.psd');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const psd = readPsd(arrayBuffer, { skipCompositeImageData: true, skipLayerImageData: true, skipThumbnail: true });

function findFotoLayer(layers) {
  if (!layers) return null;
  for (const l of layers) {
    if (l.text?.text?.trim().toLowerCase() === '{foto}') return l;
    if (l.children) {
      const found = findFotoLayer(l.children);
      if (found) return found;
    }
  }
  return null;
}

const foto = findFotoLayer(psd.children);
if (foto) {
  console.log("Found {foto} layer!");
  console.log("Bounds:", { left: foto.left, top: foto.top, right: foto.right, bottom: foto.bottom });
  console.log("Width:", (foto.right ?? 0) - (foto.left ?? 0));
  console.log("Height:", (foto.bottom ?? 0) - (foto.top ?? 0));
} else {
  console.log("Could not find {foto} layer.");
}
