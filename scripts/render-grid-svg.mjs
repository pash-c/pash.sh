#!/usr/bin/env node
/**
 * Generate a static SVG rendering of the US transmission grid using D3.
 *
 * Usage:
 *   1. npm install d3 d3-scale node-fetch
 *   2. node scripts/render-grid-svg.mjs [--color=#1f7a4d] [--out=grid.svg]
 *
 * The script downloads the FeatureServer data, projects with Albers USA,
 * and writes an SVG. Pass --color to force a single stroke color and --out
 * to change the output filename.
 */

import fs from "node:fs/promises";
import fetch from "node-fetch";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";

const WIDTH = 1600;
const HEIGHT = 900;
const PADDING = 48;

const ARCGIS_QUERY_BASE =
  "https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/" +
  "US_Electric_Power_Transmission_Lines/FeatureServer/0/query";

const voltageColors = new Map([
  [1, "#6366f1"],
  [2, "#a855f7"],
  [3, "#22d3ee"],
  [4, "#4ade80"],
  [5, "#facc15"],
  [6, "#fb923c"]
]);

const widthScale = scaleLinear().domain([1, 6]).range([0.4, 2.2]);

function parseArgs() {
  return process.argv.slice(2).reduce((acc, arg) => {
    if (!arg.startsWith("--")) return acc;
    const [key, value = "true"] = arg.slice(2).split("=");
    acc[key] = value;
    return acc;
  }, {});
}

const args = parseArgs();
const monoColor = args.color || null;
const outputFile = args.out || (monoColor ? "static-grid-mono.svg" : "static-grid.svg");

function voltageRank(voltageClass) {
  switch (voltageClass) {
    case "UNDER 100": return 1;
    case "100-161": return 2;
    case "220-287": return 3;
    case "345": return 4;
    case "500":
    case "DC": return 5;
    case "735 AND ABOVE": return 6;
    default: return 1;
  }
}

async function fetchAllTransmissionLines() {
  const pageSize = 2000;
  let offset = 0;
  const all = [];

  while (true) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "OBJECTID,VOLT_CLASS,TYPE,STATUS,OWNER",
      returnGeometry: "true",
      f: "geojson",
      outSR: "4326",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      orderByFields: "OBJECTID"
    });

    const response = await fetch(`${ARCGIS_QUERY_BASE}?${params.toString()}`);
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`ArcGIS request failed (${response.status}) ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const features = data.features || [];
    features.forEach(f => {
      const rank = voltageRank(f?.properties?.VOLT_CLASS);
      f.properties = { ...(f.properties || {}), voltage_rank: rank };
    });
    all.push(...features);

    if (features.length < pageSize || offset > 200000) break;
    offset += pageSize;
  }

  return { type: "FeatureCollection", features: all };
}

function featurePathMarkup(pathGenerator, feature) {
  const d = pathGenerator(feature);
  if (!d) return "";
  const rank = feature?.properties?.voltage_rank ?? 1;
  const stroke = monoColor ?? voltageColors.get(rank) ?? "#ffffff";
  const strokeWidth = widthScale(rank);
  return `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.9" />`;
}

async function render() {
  const geojson = await fetchAllTransmissionLines();
  console.log(`Fetched ${geojson.features.length} transmission segments`);

  const projection = geoAlbersUsa().fitExtent(
    [[PADDING, PADDING], [WIDTH - PADDING, HEIGHT - PADDING]],
    geojson
  );
  const path = geoPath(projection);

  const paths = geojson.features.map(f => featurePathMarkup(path, f)).join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${paths}
</svg>`;

  await fs.writeFile(outputFile, svg, "utf8");
  console.log(`Wrote ${outputFile}`);
}

render().catch(err => {
  console.error(err);
  process.exit(1);
});
