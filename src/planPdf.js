import { jsPDF } from "jspdf";

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const MARGIN = 14;

const PALETTES = {
  light: {
    background: "#fff8fb",
    surface: "#fffafd",
    surfaceContainer: "#f8eff6",
    primary: "#9d3f76",
    primaryContainer: "#f7d9e9",
    secondary: "#75568d",
    secondaryContainer: "#eee1f5",
    text: "#28152f",
    textMuted: "#6d5e72",
    outline: "#c9b9c9",
    white: "#ffffff",
  },
  dark: {
    background: "#171219",
    surface: "#211923",
    surfaceContainer: "#2b222d",
    primary: "#f3a9cf",
    primaryContainer: "#573147",
    secondary: "#d7b8ee",
    secondaryContainer: "#44344f",
    text: "#f4e9f3",
    textMuted: "#cdbfce",
    outline: "#6b596d",
    white: "#ffffff",
  },
};

function ascii(value) {
  return String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, "-");
}

function setText(doc, color, size, style = "normal") {
  doc.setTextColor(color);
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
}

function drawPageBackground(doc, palette) {
  doc.setFillColor(palette.background);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
}

function drawWordmark(doc, palette, y = 17) {
  setText(doc, palette.text, 15, "bold");
  doc.text("carb", MARGIN, y);
  const firstWidth = doc.getTextWidth("carb");
  setText(doc, palette.primary, 15, "bold");
  doc.text(".maxxing", MARGIN + firstWidth, y);
}

function drawHeader(doc, palette, plan, compact = false) {
  drawWordmark(doc, palette, compact ? 15 : 17);
  setText(doc, palette.textMuted, 8, "bold");
  doc.text("RACE FUEL PLAN", PAGE_WIDTH - MARGIN, compact ? 15 : 17, { align: "right" });

  if (!compact) {
    setText(doc, palette.text, 22, "bold");
    doc.text("Your race fuel plan is ready.", MARGIN, 31);
    setText(doc, palette.textMuted, 9.5);
    doc.text(ascii(`Built for a ${plan.distance} run with an estimated duration of ${plan.duration}.`), MARGIN, 39);
  }
}

function roundedPanel(doc, palette, x, y, width, height, fill = palette.surface) {
  doc.setFillColor(fill);
  doc.setDrawColor(palette.outline);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, width, height, 4, 4, "FD");
}

function drawSummaryChip(doc, palette, x, y, width, label, value) {
  doc.setFillColor(palette.surfaceContainer);
  doc.roundedRect(x, y, width, 12, 6, 6, "F");
  setText(doc, palette.textMuted, 6.8, "bold");
  doc.text(ascii(label.toUpperCase()), x + 5, y + 4.7);
  setText(doc, palette.text, 9, "bold");
  doc.text(ascii(value), x + 5, y + 9.3);
}

function drawCard(doc, palette, x, y, width, height, card, featured = false) {
  roundedPanel(doc, palette, x, y, width, height, featured ? palette.primaryContainer : palette.surface);

  doc.setFillColor(featured ? palette.secondaryContainer : palette.surfaceContainer);
  doc.circle(x + 9, y + 9, 4.5, "F");
  setText(doc, featured ? palette.primary : palette.secondary, 8, "bold");
  doc.text(ascii(card.marker), x + 9, y + 10.2, { align: "center" });

  setText(doc, palette.secondary, 7.2, "bold");
  doc.text(ascii(card.label.toUpperCase()), x + 16, y + 6.5);
  setText(doc, palette.text, 15, "bold");
  doc.text(ascii(card.target), x + 16, y + 14);
  setText(doc, palette.primary, 9.5, "bold");
  doc.text(ascii(card.total), x + 16, y + 20.5);

  setText(doc, palette.textMuted, 8.2);
  const timingLines = doc.splitTextToSize(ascii(card.timing), width - 24).slice(0, 2);
  doc.text(timingLines, x + 16, y + 27.5, { lineHeightFactor: 1.22 });

  const dividerY = y + 39;
  doc.setDrawColor(palette.outline);
  doc.line(x + 7, dividerY, x + width - 7, dividerY);
  setText(doc, palette.text, 7.8);
  const noteLines = doc.splitTextToSize(ascii(card.note), width - 14).slice(0, 3);
  doc.text(noteLines, x + 7, dividerY + 6, { lineHeightFactor: 1.25 });
}

function drawTipList(doc, palette, x, y, width, tips) {
  let cursorY = y;
  tips.forEach((tip) => {
    doc.setFillColor(palette.primary);
    doc.circle(x + 1.5, cursorY - 1, 1.25, "F");
    setText(doc, palette.text, 9);
    const lines = doc.splitTextToSize(ascii(tip), width - 9);
    doc.text(lines, x + 7, cursorY, { lineHeightFactor: 1.3 });
    cursorY += lines.length * 4.6 + 4.4;
  });
}

function drawFooter(doc, palette, pageNumber) {
  setText(doc, palette.textMuted, 7.2);
  doc.text("General guidance only. This plan is not medical advice.", MARGIN, PAGE_HEIGHT - 7);
  doc.text(`Page ${pageNumber} of 2`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 7, { align: "right" });
}

export function buildPlanPdf(plan) {
  const palette = PALETTES[plan.mode === "dark" ? "dark" : "light"];
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `Carb Maxxing - ${ascii(plan.distance)} race plan`,
    subject: "Personal carbohydrate, hydration, and race fueling plan",
    author: "Carb Maxxing",
    creator: "Carb Maxxing",
  });

  drawPageBackground(doc, palette);
  drawHeader(doc, palette, plan);

  const chipGap = 4;
  const chipWidth = (PAGE_WIDTH - MARGIN * 2 - chipGap * 3) / 4;
  const summaryItems = [
    ["Race date", plan.raceDate],
    ["Distance", plan.distance],
    ["Duration", plan.duration],
    ["Runner", plan.weight],
  ];
  summaryItems.forEach(([label, value], index) => drawSummaryChip(doc, palette, MARGIN + index * (chipWidth + chipGap), 46, chipWidth, label, value));

  const cardGap = 7;
  const cardWidth = (PAGE_WIDTH - MARGIN * 2 - cardGap) / 2;
  const cardHeight = 57;
  const cards = [
    {
      label: "Carbohydrate loading",
      marker: "C",
      target: plan.load.range,
      total: plan.load.grams,
      timing: `${plan.load.duration}, starting ${plan.load.startDate}.`,
      note: plan.load.note,
    },
    {
      label: "Race morning",
      marker: "R",
      target: "1-4 g/kg",
      total: plan.preRace,
      timing: "Eat 1-4 hours before your start.",
      note: "Choose familiar foods. Reduce fat and fiber if your stomach is sensitive.",
    },
    {
      label: "Hydration",
      marker: "H",
      target: "5-7 mL/kg",
      total: plan.hydration,
      timing: "Drink this about 4 hours before the start.",
      note: "During the race, drink to thirst or use a tested sweat-rate plan. Avoid body-weight gain.",
    },
    {
      label: "Fuel during the race",
      marker: "F",
      target: plan.fuel.target,
      total: plan.fuel.cadence,
      timing: plan.fuel.serving,
      note: plan.fuel.note,
    },
  ];
  cards.forEach((card, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawCard(doc, palette, MARGIN + column * (cardWidth + cardGap), 64 + row * (cardHeight + 7), cardWidth, cardHeight, card, index === 0 || index === 3);
  });
  drawFooter(doc, palette, 1);

  doc.addPage("a4", "landscape");
  drawPageBackground(doc, palette);
  drawHeader(doc, palette, plan, true);
  setText(doc, palette.text, 20, "bold");
  doc.text("Hydration tips and evidence", MARGIN, 31);
  setText(doc, palette.textMuted, 9.5);
  doc.text("Use this page when you test the plan during training.", MARGIN, 39);

  const leftWidth = 123;
  roundedPanel(doc, palette, MARGIN, 48, leftWidth, 124, palette.primaryContainer);
  setText(doc, palette.text, 13, "bold");
  doc.text("Hydration tips", MARGIN + 9, 62);
  drawTipList(doc, palette, MARGIN + 8, 75, leftWidth - 16, [
    "Start the race hydrated. Pale-yellow urine is a practical check.",
    "Use electrolytes for long, hot, or high-sweat runs.",
    "Practice your drink plan during training.",
    "Use your sweat rate when conditions are similar.",
  ]);

  let warningY = 127;
  if (plan.age < 18) {
    setText(doc, palette.text, 8, "bold");
    const lines = doc.splitTextToSize("Review this plan with a parent, coach, and qualified sports dietitian.", leftWidth - 18);
    doc.text(lines, MARGIN + 9, warningY, { lineHeightFactor: 1.25 });
    warningY += lines.length * 4 + 4;
  }
  if (plan.daysToRace < 2 && plan.durationMinutes > 90) {
    setText(doc, palette.text, 8, "bold");
    const lines = doc.splitTextToSize("Your race is less than 48 hours away. Use familiar foods. Do not force a large intake.", leftWidth - 18);
    doc.text(lines, MARGIN + 9, warningY, { lineHeightFactor: 1.25 });
  }

  const rightX = MARGIN + leftWidth + 8;
  const rightWidth = PAGE_WIDTH - MARGIN - rightX;
  roundedPanel(doc, palette, rightX, 48, rightWidth, 124, palette.surface);
  setText(doc, palette.text, 13, "bold");
  doc.text("Evidence and sources", rightX + 9, 62);
  setText(doc, palette.textMuted, 8.2);
  doc.text("Review the guidance behind this plan.", rightX + 9, 69);

  let sourceY = 82;
  plan.sources.forEach((source, index) => {
    setText(doc, palette.primary, 8.5, "bold");
    doc.textWithLink(`${index + 1}. ${ascii(source.label)}`, rightX + 9, sourceY, { url: source.url });
    setText(doc, palette.textMuted, 7.5);
    doc.text(ascii(source.detail), rightX + 14, sourceY + 5);
    sourceY += 20;
  });

  doc.setFillColor(palette.secondaryContainer);
  doc.roundedRect(rightX + 8, 151, rightWidth - 16, 16, 5, 5, "F");
  setText(doc, palette.text, 7.2, "bold");
  const profileNote = doc.splitTextToSize("Age and height support profile and safety checks. Standard targets use body weight and expected duration.", rightWidth - 28);
  doc.text(profileNote, rightX + 13, 157.2, { lineHeightFactor: 1.25 });
  drawFooter(doc, palette, 2);

  return doc;
}

export function downloadPlanPdf(plan) {
  const filenamePart = ascii(plan.distance).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  buildPlanPdf(plan).save(`carb-maxxing-${filenamePart || "race"}-plan.pdf`);
}
