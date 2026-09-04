import fs from "fs";
import { JSDOM } from "jsdom";
import * as docx from "docx-preview";

async function run() {
  const dom = new JSDOM("<!DOCTYPE html><html><body><div id='output'></div></body></html>", {
    pretendToBeVisual: true,
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.SVGElement = dom.window.SVGElement;
  global.Node = dom.window.Node;
  global.Blob = dom.window.Blob;
  global.DOMParser = dom.window.DOMParser;
  global.XMLSerializer = dom.window.XMLSerializer;

  const res = await fetch("https://pcalfbxvlbmqbhhazbax.supabase.co/storage/v1/object/public/templates/document-templates/doc_tpl_1785242075928_c8amy.docx");
  const ab = await res.arrayBuffer();

  const container = dom.window.document.getElementById("output");
  await docx.renderAsync(ab, container, undefined, {
    className: "docx",
    inWrapper: true,
    renderHeaders: true,
    renderFooters: true,
    experimental: true,
  });

  const html = container.innerHTML;
  console.log("With experimental: true -> has header text:", html.includes("KEMENTERIAN PENDIDIKAN"));
  console.log("has UNESA:", html.includes("UNIVERSITAS NEGERI SURABAYA"));
}

run().catch(console.error);
