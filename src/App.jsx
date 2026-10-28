import { useEffect, useMemo, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, AppBar, Box, Button, Card,
  CardActionArea, CardContent, Chip, CssBaseline, Divider, IconButton, LinearProgress,
  Link, Paper, Stack, TextField, ThemeProvider, ToggleButton, ToggleButtonGroup,
  Toolbar, Typography, createTheme,
} from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import DirectionsRunRounded from "@mui/icons-material/DirectionsRunRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import FlagRounded from "@mui/icons-material/FlagRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import LocalDrinkRounded from "@mui/icons-material/LocalDrinkRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import RestaurantRounded from "@mui/icons-material/RestaurantRounded";
import RouteRounded from "@mui/icons-material/RouteRounded";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import SportsScoreRounded from "@mui/icons-material/SportsScoreRounded";

const DISTANCES = [
  { id: "5k", label: "5K", km: 5, defaultMinutes: 30, Icon: DirectionsRunRounded },
  { id: "10k", label: "10K", km: 10, defaultMinutes: 60, Icon: RouteRounded },
  { id: "half", label: "Half marathon", km: 21.1, defaultMinutes: 120, Icon: SportsScoreRounded },
  { id: "marathon", label: "Marathon", km: 42.2, defaultMinutes: 240, Icon: FlagRounded },
];

const SCREEN_ORDER = ["profile", "date", "distance", "duration", "plan"];

const SOURCES = [
  {
    label: "Dietary carbohydrate and the endurance athlete",
    detail: "Gatorade Sports Science Institute",
    url: "https://www.gssiweb.org/sports-science-exchange/article/dietary-carbohydrate-and-the-endurance-athlete-contemporary-perspectives",
  },
  {
    label: "A step towards personalized sports nutrition",
    detail: "Jeukendrup, Sports Medicine",
    url: "https://pubmed.ncbi.nlm.nih.gov/24791914/",
  },
  {
    label: "Nutrition and athletic performance",
    detail: "Academy of Nutrition and Dietetics, Dietitians of Canada, and ACSM",
    url: "https://pubmed.ncbi.nlm.nih.gov/26920240/",
  },
  {
    label: "Fluid replacement for the physically active",
    detail: "National Athletic Trainers’ Association",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5634236/",
  },
];

const pad = (value) => String(value).padStart(2, "0");
const roundToFive = (value) => Math.round(value / 5) * 5;
const kgToLb = (kg) => kg * 2.2046226218;
const lbToKg = (lb) => lb / 2.2046226218;
const kmToMiles = (km) => km * 0.621371;
const milesToKm = (miles) => miles / 0.621371;

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function differenceInDays(later, earlier) {
  const start = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  const end = new Date(later.getFullYear(), later.getMonth(), later.getDate());
  return Math.ceil((end - start) / 86400000);
}

function getLoadPlan(weightKg, durationMinutes, raceDate) {
  if (durationMinutes > 90) {
    return {
      range: "10–12 g/kg/day",
      grams: `${roundToFive(weightKg * 10)}–${roundToFive(weightKg * 12)} g/day`,
      duration: "36–48 hours",
      startDate: formatDate(addDays(raceDate, -2)),
      note: "Spread the target across familiar meals, snacks, and drinks. Reduce fiber if your stomach is sensitive.",
    };
  }
  if (durationMinutes >= 60) {
    return {
      range: "6–8 g/kg/day",
      grams: `${roundToFive(weightKg * 6)}–${roundToFive(weightKg * 8)} g/day`,
      duration: "The day before",
      startDate: formatDate(addDays(raceDate, -1)),
      note: "A lighter carbohydrate top-up is usually enough. A full load is often not necessary below 90 minutes.",
    };
  }
  return {
    range: "5–7 g/kg/day",
    grams: `${roundToFive(weightKg * 5)}–${roundToFive(weightKg * 7)} g/day`,
    duration: "The day before",
    startDate: formatDate(addDays(raceDate, -1)),
    note: "Keep normal meals carbohydrate-rich. An aggressive carbohydrate load is usually not needed.",
  };
}

function getFuelPlan(durationMinutes) {
  if (durationMinutes < 45) return { target: "Usually none", cadence: "No planned fuel", serving: "Start well fueled. Water is usually enough during a short run.", note: "Use familiar food before the start." };
  if (durationMinutes < 75) return { target: "A small amount", cadence: "Around halfway", serving: "Use a few sips of sports drink or a carbohydrate mouth rinse if it helps.", note: "Fuel is optional for many runners at this duration." };
  if (durationMinutes <= 150) return { target: "30–60 g/hour", cadence: "Every 20–30 minutes", serving: "Take about 10–20 g every 20 minutes or 15–30 g every 30 minutes.", note: "Start early. Do not wait until you feel depleted." };
  return { target: "60–90 g/hour", cadence: "Every 20–30 minutes", serving: "Take about 20–30 g every 20 minutes or 30–45 g every 30 minutes.", note: "Use a glucose and fructose mix. Practice this intake during long runs." };
}

function getDefaultRaceDate() {
  return toDateInput(addDays(new Date(), 19));
}

function getTheme(mode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? "#f3a9cf" : "#9d3f76", contrastText: dark ? "#3b0a2a" : "#fff7fb" },
      secondary: { main: dark ? "#d7b8ee" : "#75568d" },
      background: { default: dark ? "#171219" : "#fff8fb", paper: dark ? "#211923" : "#fffafd" },
      text: { primary: dark ? "#f4e9f3" : "#28152f", secondary: dark ? "#cdbfce" : "#6d5e72" },
      divider: dark ? "#4b3d4d" : "#e8dbe8",
      error: { main: dark ? "#ffb1c8" : "#a83d61" },
    },
    shape: { borderRadius: 22 },
    typography: {
      fontFamily: '"Roboto Flex", "Roboto", system-ui, sans-serif',
      h1: { fontSize: "clamp(2.45rem, 4.6vw, 3.55rem)", lineHeight: 1.04, letterSpacing: "-0.045em", fontWeight: 750 },
      h2: { fontSize: "clamp(1.9rem, 3.2vw, 2.75rem)", lineHeight: 1.1, letterSpacing: "-0.035em", fontWeight: 720 },
      h3: { fontSize: "1.2rem", lineHeight: 1.2, fontWeight: 700 },
      body1: { lineHeight: 1.55 },
      button: { fontWeight: 700, letterSpacing: 0, textTransform: "none" },
      overline: { fontWeight: 750, letterSpacing: "0.11em" },
    },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { minWidth: 320, minHeight: "100vh", backgroundColor: dark ? "#171219" : "#fff8fb" }, "::selection": { backgroundColor: dark ? "#6d3858" : "#f3c7df" } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 50, borderRadius: 999, paddingInline: 28 } } },
      MuiIconButton: { styleOverrides: { root: { width: 48, height: 48, border: `1px solid ${dark ? "#57485a" : "#e4d6e5"}`, backgroundColor: dark ? "#2b222d" : "#fffafd" } } },
      MuiOutlinedInput: { styleOverrides: { root: { minHeight: 58, borderRadius: 18, backgroundColor: dark ? "#241c26" : "#fffbfd" } } },
      MuiToggleButtonGroup: { styleOverrides: { root: { padding: 3, border: `1px solid ${dark ? "#57485a" : "#e4d6e5"}`, borderRadius: 999, backgroundColor: dark ? "#2b222d" : "#fffafd" } } },
      MuiToggleButton: { styleOverrides: { root: { minWidth: 86, minHeight: 38, border: "0 !important", borderRadius: "999px !important", color: dark ? "#cdbfce" : "#514354", fontWeight: 700, textTransform: "none", "&.Mui-selected": { color: dark ? "#381028" : "#4a1738", backgroundColor: dark ? "#e6a4c8" : "#f2c5de" }, "&.Mui-selected:hover": { backgroundColor: dark ? "#efb3d1" : "#edb8d5" } } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiAccordion: { styleOverrides: { root: { backgroundImage: "none", border: `1px solid ${dark ? "#4b3d4d" : "#e8dbe8"}`, borderRadius: "22px !important", boxShadow: "none", overflow: "hidden", "&::before": { display: "none" } } } },
    },
  });
}

function StageProgress({ stage }) {
  const majorStep = stage === "profile" ? 1 : stage === "plan" ? 3 : 2;
  const label = stage === "profile" ? "Runner profile" : stage === "plan" ? "Your plan" : "Race details";
  return (
    <Box className="stage-progress" aria-label={`${label}, step ${majorStep} of 3`}>
      <Stack direction="row" spacing={1} aria-hidden="true">
        {[1, 2, 3].map((step) => <LinearProgress key={step} variant="determinate" value={step <= majorStep ? 100 : 0} className={step === majorStep ? "current-progress" : ""} />)}
      </Stack>
      <Typography color="text.secondary" fontWeight={650}>{label} · {majorStep} of 3</Typography>
    </Box>
  );
}

function ScreenHeading({ eyebrow, title, body }) {
  return (
    <Box className="screen-heading">
      <Chip label={eyebrow} size="small" color="secondary" />
      <Typography component="h1" variant="h1">{title}</Typography>
      <Typography color="text.secondary" className="screen-intro">{body}</Typography>
    </Box>
  );
}

function NavigationButtons({ back, nextLabel }) {
  return (
    <Stack className="flow-actions" direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ justifyContent: "center" }}>
      {back ? <Button type="button" variant="outlined" color="secondary" startIcon={<ArrowBackRounded />} onClick={back}>Back</Button> : null}
      <Button type="submit" variant="contained" color="primary" endIcon={<ArrowForwardRounded />}>{nextLabel}</Button>
    </Stack>
  );
}

export function App() {
  const [mode, setMode] = useState(() => localStorage.getItem("carb-maxxing-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [unitSystem, setUnitSystem] = useState("metric");
  const [stage, setStage] = useState("profile");
  const [attempted, setAttempted] = useState(false);
  const [age, setAge] = useState(32);
  const [heightCm, setHeightCm] = useState(168);
  const [weightKg, setWeightKg] = useState(60);
  const [raceDate, setRaceDate] = useState(getDefaultRaceDate);
  const [distance, setDistance] = useState("half");
  const [customDistanceKm, setCustomDistanceKm] = useState(15);
  const [showCustomDistance, setShowCustomDistance] = useState(false);
  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const parsedRaceDate = new Date(`${raceDate}T12:00:00`);
  const daysToRace = differenceInDays(parsedRaceDate, new Date());
  const durationMinutes = Number(hours) * 60 + Number(minutes);
  const selectedDistance = DISTANCES.find((item) => item.id === distance);
  const distanceKm = distance === "custom" ? Number(customDistanceKm) : selectedDistance?.km;
  const heightInches = Math.round(Number(heightCm) / 2.54);
  const heightFeet = Math.floor(heightInches / 12);
  const remainingInches = heightInches % 12;

  useEffect(() => {
    localStorage.setItem("carb-maxxing-theme", mode);
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const stageError = useMemo(() => {
    if (stage === "profile") {
      if (!Number.isFinite(Number(age)) || age < 13 || age > 100) return "Enter an age from 13 to 100.";
      if (!Number.isFinite(Number(heightCm)) || heightCm < 100 || heightCm > 250) return unitSystem === "metric" ? "Enter a height from 100 to 250 cm." : "Enter a height from about 3 ft 3 in to 8 ft 2 in.";
      if (!Number.isFinite(Number(weightKg)) || weightKg < 30 || weightKg > 250) return unitSystem === "metric" ? "Enter a weight from 30 to 250 kg." : "Enter a weight from 66 to 551 lb.";
    }
    if (stage === "date") {
      if (!raceDate || Number.isNaN(parsedRaceDate.getTime())) return "Choose a valid race date.";
      if (daysToRace < 0) return "Choose today or a future race date.";
    }
    if (stage === "distance" && (!Number.isFinite(Number(distanceKm)) || distanceKm < 1 || distanceKm > 100)) return unitSystem === "metric" ? "Enter a distance from 1 to 100 km." : "Enter a distance from 0.6 to 62 miles.";
    if (stage === "duration") {
      if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 720) return "Enter an estimated duration from 15 minutes to 12 hours.";
      if (Number(minutes) < 0 || Number(minutes) > 59) return "Enter minutes from 0 to 59.";
    }
    return "";
  }, [age, heightCm, weightKg, unitSystem, stage, raceDate, parsedRaceDate, daysToRace, distanceKm, durationMinutes, minutes]);

  const plan = useMemo(() => {
    const load = getLoadPlan(Number(weightKg), durationMinutes, parsedRaceDate);
    const fuel = getFuelPlan(durationMinutes);
    const mealLow = roundToFive(Number(weightKg));
    const mealHigh = roundToFive(Number(weightKg) * 4);
    const hydrationLowMl = Math.round(Number(weightKg) * 5);
    const hydrationHighMl = Math.round(Number(weightKg) * 7);
    const hydration = unitSystem === "metric" ? `${hydrationLowMl}–${hydrationHighMl} mL` : `${(hydrationLowMl / 29.5735).toFixed(0)}–${(hydrationHighMl / 29.5735).toFixed(0)} fl oz`;
    return { load, fuel, preRace: `${mealLow}–${mealHigh} g`, hydration };
  }, [weightKg, durationMinutes, parsedRaceDate, unitSystem]);

  function goTo(nextStage) {
    setAttempted(false);
    setStage(nextStage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setAttempted(true);
    if (stageError) return;
    goTo(SCREEN_ORDER[SCREEN_ORDER.indexOf(stage) + 1]);
  }

  function handleBack() {
    const currentIndex = SCREEN_ORDER.indexOf(stage);
    if (currentIndex > 0) goTo(SCREEN_ORDER[currentIndex - 1]);
  }

  function chooseDistance(item) {
    setDistance(item.id);
    setShowCustomDistance(false);
    setHours(Math.floor(item.defaultMinutes / 60));
    setMinutes(item.defaultMinutes % 60);
  }

  function setFeet(value) {
    setHeightCm(Math.round(Math.max(0, Number(value) * 12 + remainingInches) * 2.54));
  }

  function setInches(value) {
    setHeightCm(Math.round(Math.max(0, heightFeet * 12 + Number(value)) * 2.54));
  }

  const distanceDisplay = unitSystem === "metric" ? `${Number(distanceKm).toFixed(distanceKm % 1 ? 1 : 0)} km` : `${kmToMiles(Number(distanceKm)).toFixed(1)} miles`;
  const weightDisplay = unitSystem === "metric" ? `${Number(weightKg).toFixed(1).replace(".0", "")} kg` : `${kgToLb(Number(weightKg)).toFixed(1)} lb`;
  const timeDisplay = `${hours}:${pad(minutes)}`;

  async function handleDownloadPdf() {
    setPdfBusy(true);
    try {
      const { downloadPlanPdf } = await import("./planPdf");
      downloadPlanPdf({
        mode,
        raceDate: formatDate(parsedRaceDate),
        distance: distanceDisplay,
        duration: timeDisplay,
        durationMinutes,
        weight: weightDisplay,
        age: Number(age),
        daysToRace,
        load: plan.load,
        preRace: plan.preRace,
        hydration: plan.hydration,
        fuel: plan.fuel,
        sources: SOURCES,
      });
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="app-frame"
        style={{
          "--cm-primary": theme.palette.primary.main,
          "--cm-on-primary": theme.palette.primary.contrastText,
          "--cm-primary-container": mode === "dark" ? "#573147" : "#f7d9e9",
          "--cm-secondary-container": mode === "dark" ? "#44344f" : "#eee1f5",
          "--cm-surface-container": mode === "dark" ? "#2b222d" : "#f8eff6",
          "--cm-outline": mode === "dark" ? "#6b596d" : "#c9b9c9",
        }}
      >
        <AppBar position="static" color="transparent" elevation={0} className="top-app-bar">
          <Toolbar>
            <Typography className="wordmark" aria-label="Carb Maxxing">carb<span>.maxxing</span></Typography>
            <Stack direction="row" spacing={{ xs: 1, sm: 2 }} sx={{ alignItems: "center" }}>
              <ToggleButtonGroup value={unitSystem} exclusive size="small" aria-label="Measurement system" onChange={(_, value) => value && setUnitSystem(value)}>
                <ToggleButton value="metric">Metric</ToggleButton>
                <ToggleButton value="us">US</ToggleButton>
              </ToggleButtonGroup>
              <IconButton aria-label={mode === "light" ? "Use dark theme" : "Use light theme"} onClick={() => setMode((current) => current === "light" ? "dark" : "light")}>
                {mode === "light" ? <DarkModeRounded /> : <LightModeRounded />}
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box component="main" className="workflow-layout">
          <StageProgress stage={stage} />

          {stage !== "plan" ? (
            <Box component="form" onSubmit={handleSubmit} noValidate className="flow-screen" key={stage}>
              {stage === "profile" ? (
                <>
                  <ScreenHeading eyebrow="Runner profile" title="Let’s start with you." body="We use your body weight to calculate carbohydrate and hydration targets." />
                  <Paper variant="outlined" className="profile-panel">
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }} className="panel-title">
                      <Box className="title-icon"><PersonRounded /></Box>
                      <Box><Typography variant="h3">Your profile</Typography><Typography color="text.secondary" variant="body2">You can change units at any time.</Typography></Box>
                    </Stack>
                    <Box className="profile-grid">
                      <TextField label="Age" type="number" value={age} onChange={(event) => setAge(event.target.value)} slotProps={{ htmlInput: { min: 13, max: 100 } }} helperText="Years" />
                      {unitSystem === "metric" ? (
                        <TextField label="Height" type="number" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} slotProps={{ htmlInput: { min: 100, max: 250 } }} helperText="Centimeters" />
                      ) : (
                        <Stack direction="row" spacing={1.5}><TextField label="Height" type="number" value={heightFeet} onChange={(event) => setFeet(event.target.value)} helperText="Feet" /><TextField label="Height" type="number" value={remainingInches} onChange={(event) => setInches(event.target.value)} helperText="Inches" /></Stack>
                      )}
                      <TextField label="Weight" type="number" value={unitSystem === "metric" ? Number(weightKg).toFixed(1).replace(".0", "") : kgToLb(Number(weightKg)).toFixed(1)} onChange={(event) => setWeightKg(unitSystem === "metric" ? event.target.value : lbToKg(event.target.value))} helperText={unitSystem === "metric" ? "Kilograms" : "Pounds"} />
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }} className="privacy-note"><LockRounded fontSize="small" /><Typography variant="body2" color="text.secondary">Your answers stay in this browser.</Typography></Stack>
                  </Paper>
                  {attempted && stageError ? <Alert severity="error">{stageError}</Alert> : null}
                  <NavigationButtons nextLabel="Next: race details" />
                </>
              ) : null}

              {stage === "date" ? (
                <>
                  <ScreenHeading eyebrow="Race details · 1 of 3" title="When is race day?" body="Your race date tells us when your carbohydrate-loading window should begin." />
                  <Paper variant="outlined" className="single-question-panel">
                    <CalendarMonthRounded className="question-icon" />
                    <TextField label="Race date" type="date" value={raceDate} onChange={(event) => setRaceDate(event.target.value)} slotProps={{ htmlInput: { min: toDateInput(new Date()) }, inputLabel: { shrink: true } }} fullWidth />
                    <Typography color="text.secondary">{daysToRace >= 0 ? `${daysToRace} day${daysToRace === 1 ? "" : "s"} from today` : "Choose today or a future date"}</Typography>
                  </Paper>
                  {attempted && stageError ? <Alert severity="error">{stageError}</Alert> : null}
                  <NavigationButtons back={handleBack} nextLabel="Next: distance" />
                </>
              ) : null}

              {stage === "distance" ? (
                <>
                  <ScreenHeading eyebrow="Race details · 2 of 3" title="How far are you running?" body="Choose your race distance to get personalized carbohydrate-loading recommendations." />
                  <Box className="distance-grid" role="radiogroup" aria-label="Race distance">
                    {DISTANCES.map((item) => {
                      const selected = distance === item.id && !showCustomDistance;
                      const DetailIcon = item.Icon;
                      return (
                        <Card key={item.id} variant="outlined" className={`distance-card ${selected ? "selected" : ""}`}>
                          <CardActionArea role="radio" aria-checked={selected} onClick={() => chooseDistance(item)}>
                            <CardContent>
                              <Box className="distance-icon"><DetailIcon /></Box>
                              <Box><Typography variant="h3">{item.label}</Typography><Typography color="text.secondary">{unitSystem === "metric" ? `${item.km} kilometers` : `${kmToMiles(item.km).toFixed(1)} miles`}</Typography></Box>
                              {selected ? <Box className="selection-check"><CheckRounded /></Box> : null}
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      );
                    })}
                  </Box>
                  <Box className="custom-distance">
                    <Button type="button" variant="text" color="secondary" onClick={() => { setShowCustomDistance((value) => !value); setDistance("custom"); }}>{showCustomDistance ? "Use a standard distance" : "Enter a custom distance"}</Button>
                    {showCustomDistance ? <TextField autoFocus label={unitSystem === "metric" ? "Distance in kilometers" : "Distance in miles"} type="number" value={unitSystem === "metric" ? customDistanceKm : kmToMiles(customDistanceKm).toFixed(1)} onChange={(event) => setCustomDistanceKm(unitSystem === "metric" ? event.target.value : milesToKm(event.target.value))} slotProps={{ htmlInput: { min: unitSystem === "metric" ? 1 : 0.6, max: unitSystem === "metric" ? 100 : 62, step: 0.1 } }} /> : null}
                  </Box>
                  {attempted && stageError ? <Alert severity="error">{stageError}</Alert> : null}
                  <NavigationButtons back={handleBack} nextLabel="Next: duration" />
                </>
              ) : null}

              {stage === "duration" ? (
                <>
                  <ScreenHeading eyebrow="Race details · 3 of 3" title="How long will your run take?" body="We use this estimate to set your carbohydrate-loading and in-race fueling targets." />
                  <Paper variant="outlined" className="single-question-panel duration-panel">
                    <ScheduleRounded className="question-icon" />
                    <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }} className="duration-inputs"><TextField label="Hours" type="number" value={hours} onChange={(event) => setHours(event.target.value)} slotProps={{ htmlInput: { min: 0, max: 12 } }} /><Typography aria-hidden="true" variant="h2">:</Typography><TextField label="Minutes" type="number" value={minutes} onChange={(event) => setMinutes(event.target.value)} slotProps={{ htmlInput: { min: 0, max: 59 } }} /></Stack>
                    <Typography color="text.secondary">Suggested from your selected distance. Adjust it to match your expected pace.</Typography>
                  </Paper>
                  {attempted && stageError ? <Alert severity="error">{stageError}</Alert> : null}
                  <NavigationButtons back={handleBack} nextLabel="Create my plan" />
                </>
              ) : null}
            </Box>
          ) : (
            <Box className="flow-screen results-screen" key="plan">
              <ScreenHeading eyebrow="Your plan" title="Your race fuel plan is ready." body={`Built for a ${distanceDisplay} run with an estimated duration of ${timeDisplay}.`} />
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "center" }} className="plan-summary"><Chip icon={<EmojiEventsRounded />} label={formatDate(parsedRaceDate)} /><Chip icon={<RouteRounded />} label={distanceDisplay} /><Chip icon={<ScheduleRounded />} label={timeDisplay} /><Chip icon={<PersonRounded />} label={weightDisplay} /></Stack>
              <Box className="results-grid">
                <Card variant="outlined" className="result-card featured-result"><CardContent><Box className="result-icon"><RestaurantRounded /></Box><Typography variant="overline">Carbohydrate loading</Typography><Typography variant="h2">{plan.load.range}</Typography><Typography className="result-total">{plan.load.grams}</Typography><Typography color="text.secondary">{plan.load.duration}, starting {plan.load.startDate}.</Typography><Divider /><Typography variant="body2">{plan.load.note}</Typography></CardContent></Card>
                <Card variant="outlined" className="result-card"><CardContent><Box className="result-icon"><DirectionsRunRounded /></Box><Typography variant="overline">Race morning</Typography><Typography variant="h2">1–4 g/kg</Typography><Typography className="result-total">{plan.preRace}</Typography><Typography color="text.secondary">Eat 1–4 hours before your start.</Typography><Divider /><Typography variant="body2">Choose familiar foods. Reduce fat and fiber if your stomach is sensitive.</Typography></CardContent></Card>
                <Card variant="outlined" className="result-card"><CardContent><Box className="result-icon"><LocalDrinkRounded /></Box><Typography variant="overline">Hydration</Typography><Typography variant="h2">5–7 mL/kg</Typography><Typography className="result-total">{plan.hydration}</Typography><Typography color="text.secondary">Drink this about 4 hours before the start.</Typography><Divider /><Typography variant="body2">During the race, drink to thirst or use a tested sweat-rate plan. Avoid drinking enough to gain body weight.</Typography></CardContent></Card>
                <Card variant="outlined" className="result-card featured-result"><CardContent><Box className="result-icon"><ScheduleRounded /></Box><Typography variant="overline">Fuel during the race</Typography><Typography variant="h2">{plan.fuel.target}</Typography><Typography className="result-total">{plan.fuel.cadence}</Typography><Typography color="text.secondary">{plan.fuel.serving}</Typography><Divider /><Typography variant="body2">{plan.fuel.note}</Typography></CardContent></Card>
              </Box>
              <Paper variant="outlined" className="hydration-tips"><Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}><Box className="title-icon"><LocalDrinkRounded /></Box><Typography variant="h3">Hydration tips</Typography></Stack><Box component="ul"><li>Start the race hydrated. Pale-yellow urine is a practical check.</li><li>Use electrolytes for long, hot, or high-sweat runs.</li><li>Practice your drink plan during training.</li><li>Use your sweat rate when conditions are similar.</li></Box></Paper>
              {age < 18 ? <Alert severity="info">Review this plan with a parent, coach, and qualified sports dietitian.</Alert> : null}
              {daysToRace < 2 && durationMinutes > 90 ? <Alert severity="warning">Your race is less than 48 hours away. Use familiar foods and do not force a large intake.</Alert> : null}
              <Accordion className="sources-accordion"><AccordionSummary expandIcon={<ExpandMoreRounded />}><Box><Typography fontWeight={750}>Evidence and sources</Typography><Typography variant="body2" color="text.secondary">Review the guidance behind this plan.</Typography></Box></AccordionSummary><AccordionDetails><Stack spacing={2}>{SOURCES.map((source) => <Box key={source.url}><Link href={source.url} target="_blank" rel="noreferrer" fontWeight={700}>{source.label}</Link><Typography variant="body2" color="text.secondary">{source.detail}</Typography></Box>)}</Stack></AccordionDetails></Accordion>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "center" }} className="result-actions"><Button variant="contained" color="primary" startIcon={<DownloadRounded />} onClick={handleDownloadPdf} loading={pdfBusy}>{pdfBusy ? "Preparing PDF" : "Download PDF"}</Button><Button variant="outlined" color="secondary" startIcon={<ArrowBackRounded />} onClick={() => goTo("duration")}>Edit duration</Button><Button variant="text" color="secondary" startIcon={<PersonRounded />} onClick={() => goTo("profile")}>Start over</Button></Stack>
            </Box>
          )}
        </Box>

        <Box component="footer" className="site-footer"><Typography variant="body2"><strong>General guidance only.</strong> This tool is not medical advice. Ask a sports dietitian or clinician for personal guidance if you have a health condition or take medicine that affects fluid balance.</Typography><Typography variant="caption" color="text.secondary">Age and height support profile and safety checks. Standard carbohydrate targets use body weight and expected exercise duration.</Typography></Box>
      </Box>
    </ThemeProvider>
  );
}
