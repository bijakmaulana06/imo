import { readPsd } from 'ag-psd';
import fs from 'fs';

async function parseLocal() {
  const buffer = fs.readFileSync('scratch/template.psd');
  console.log(`Read ${buffer.length} bytes from scratch/template.psd.`);

  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const psd = readPsd(arrayBuffer, { skipCompositeImageData: true, skipLayerImageData: true, skipThumbnail: true });

  console.log(`\nPSD Dimensions: ${psd.width} x ${psd.height}`);
  console.log(`Top-level children count: ${psd.children?.length ?? 0}`);

  function printLayers(layers, depth = 0) {
    if (!layers) return;
    const indent = '  '.repeat(depth);
    layers.forEach((layer, idx) => {
      const isText = !!layer.text?.text;
      const textVal = layer.text?.text ? `[Text: "${layer.text.text.replace(/\n/g, '\\n')}"]` : '';
      const isGroup = !!layer.children;
      console.log(`${indent}[Index ${idx}] Name: "${layer.name}" | Hidden: ${!!layer.hidden} | IsGroup: ${isGroup} | IsText: ${isText} ${textVal}`);
      if (layer.children) {
        printLayers(layer.children, depth + 1);
      }
    });
  }

  console.log('\n--- PSD LAYER TREE (Index 0 = TOP layer in Photoshop UI) ---');
  printLayers(psd.children);
}

parseLocal().catch(console.error);
