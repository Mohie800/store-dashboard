"use client";

import { useState, useEffect } from "react";

const CODE39_PATTERNS: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  $: "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

function toBase64Svg(svg: string): string | null {
  try {
    if (typeof window !== "undefined" && window.btoa) {
      return `data:image/svg+xml;base64,${window.btoa(
        unescape(encodeURIComponent(svg))
      )}`;
    }

    if (typeof Buffer !== "undefined") {
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    }
  } catch (error) {
    console.error("Failed to encode SVG", error);
  }

  return null;
}

export function createCode39DataUrl(rawValue: string): string | null {
  if (!rawValue) {
    return null;
  }

  const value = rawValue.toUpperCase().replace(/[^0-9A-Z\-\. \$/\+%]/g, "");
  const encoded = `*${value}*`;
  const narrow = 2;
  const wide = narrow * 3;
  const height = 50;
  let currentX = 0;
  const segments: string[] = [];

  for (let index = 0; index < encoded.length; index += 1) {
    const char = encoded[index];
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) {
      continue;
    }

    for (let pos = 0; pos < pattern.length; pos += 1) {
      const isBar = pos % 2 === 0;
      const width = pattern[pos] === "w" ? wide : narrow;

      if (isBar) {
        segments.push(
          `<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="#000" />`
        );
      }

      currentX += width;
    }

    currentX += narrow;
  }

  const textY = height + 14;
  const svgWidth = currentX + narrow;
  const svgHeight = height + 24;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${segments.join("\n  ")}
  <text x="50%" y="${textY}" font-family="monospace" font-size="14" text-anchor="middle" fill="#000">${encoded}</text>
</svg>`;

  return toBase64Svg(svg);
}

export function useQRCode(value: string | null) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!value) {
      setDataUrl(null);
      return () => {
        isMounted = false;
      };
    }

    (async () => {
      try {
        const { toDataURL } = await import("qrcode");
        const url = await toDataURL(value, {
          type: "image/png",
          errorCorrectionLevel: "M",
          margin: 1,
          scale: 6,
        });

        if (isMounted) {
          setDataUrl(url);
        }
      } catch (error) {
        console.error("Failed to generate QR code", error);
        if (isMounted) {
          setDataUrl(null);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [value]);

  return dataUrl;
}
