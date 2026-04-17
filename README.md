# MyCareerKit v2

A desktop job-hunt application for the Swedish market. Built with PySide6 and Python. Talks to multiple LLM backends to generate tailored CVs and cover letters. Has a themed AI assistant with a full persona and lorebook system. Ships with an original AI-produced soundtrack. Made by one person.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Systems](#core-systems)
  - [Config & Path Resolution](#config--path-resolution)
  - [Profile System](#profile-system)
  - [LLM Layer](#llm-layer)
  - [CV Generator](#cv-generator)
  - [Cover Letter Generator](#cover-letter-generator)
  - [Job Search](#job-search)
  - [Job Details Window](#job-details-window)
  - [Photo Toolkit](#photo-toolkit)
  - [Queenie — AI Assistant](#queenie--ai-assistant)
  - [Diary System](#diary-system)
  - [Media Player](#media-player)
- [UI Architecture](#ui-architecture)
  - [Dashboard](#dashboard)
  - [Profile Tabs](#profile-tabs)
    - [Contact Tab](#contact-tab)
    - [Experience Tab](#experience-tab)
    - [Skills Tab](#skills-tab)
    - [CV Gallery Tab](#cv-gallery-tab)
    - [Letters Tab](#letters-tab)
    - [Photo Tab](#photo-tab)
- [Theming](#theming)
- [Data Storage](#data-storage)
- [Build & Distribution](#build--distribution)
- [Dependencies](#dependencies)
- [Environment Variables](#environment-variables)
- [Developer Notes](#developer-notes)

---

## What It Does

MyCareerKit is a standalone Windows desktop app targeting the Swedish job market. Core loop: find a job on Arbetsförmedlingen → save it → generate a tailored CV and cover letter using an LLM → refine the photo → apply.

Feature summary:

- **Multi-profile support** — separate data folders per user, selected at launch via a picker dialog
- **Job search** — live search against the Arbetsförmedlingen JobTech API with pagination, card view, full-detail popup, and save/favourite
- **CV generator** — LLM generates a complete self-contained HTML/CSS CV from profile data + job data. No templates. Style, layout, complexity, and language are all configurable
- **Cover letter generator** — same pipeline, generates plain text tailored to the target job
- **Photo toolkit** — ESRGAN upscaling, background removal via rembg, background replacement, depth-estimated fake bokeh, brightness/contrast corrections; all on QThread workers
- **Queenie** — an in-app AI assistant with swappable personas, a keyword-triggered lorebook, multi-turn conversation history, and a private diary system
- **Media player** — persistent bottom bar playing an original 15-track soundtrack made with Suno

---

## Architecture Overview

```
main.py
  └─ QApplication
       ├─ ProfilePickerDialog       # startup profile selection
       └─ MainWindow
            ├─ SideMenu             # nav
            ├─ TopBar               # window chrome
            ├─ MediaPlayerBar       # global music player
            ├─ DashboardPage
            ├─ JobSearchPage
            ├─ ProfilePage
            │    ├─ ContactTab
            │    ├─ ExperienceTab
            │    ├─ SkillsTab
            │    ├─ CvGalleryTab
            │    ├─ LetterTab
            │    ├─ SavedJobsTab
            │    └─ PhotoTab
            └─ SettingsPage
                 ├─ ApiKeysTab
                 ├─ AppearanceTab
                 └─ LocalAiTab

Separate QWidget windows (not dialogs):
  CvGeneratorWindow
  CoverLetterWindow
  PhotoToolkitWindow
  JobDetailsWindow
  LetterViewerWindow
```

The app is not MDI. Secondary windows (`CvGeneratorWindow`, `PhotoToolkitWindow`, etc.) are plain `QWidget` instances spawned with `Qt.WindowType.Window`. They do not block the main window.

---

## Project Structure

```
MyCareerKit_v2/
├─ main.py                          Entry point
├─ requirements.txt
├─ build.bat / BUILD.md             PyInstaller build scripts
├─ data/
│  ├─ profiles/                     Per-user profile folders (user-writable)
│  ├─ music/                        Soundtrack (.mp3)
│  ├─ logs/
│  └─ queenie/
│     ├─ personas/                  Persona JSON cards (queenie.json, christian.json)
│     └─ lorebooks/                 Lorebook JSON files
├─ src/
│  ├─ core/
│  │  ├─ config.py                  All paths, frozen/dev detection, logging setup
│  │  ├─ cv_entry.py                CV entry data structures
│  │  └─ profile_manager.py         Profile CRUD + job save/load
│  ├─ services/
│  │  ├─ job_service.py             Arbetsförmedlingen API client + QThread search worker
│  │  ├─ pdf_converter.py           HTML-to-PDF via Playwright
│  │  ├─ photo_workers.py           QThread workers: upscale, rembg, bokeh, corrections
│  │  ├─ thumbnail_generator.py     CV thumbnail generation
│  │  └─ llm/
│  │     ├─ base.py                 GenerationRequest, BaseLLMClient
│  │     ├─ clients/
│  │     │  ├─ anthropic_client.py  Claude (streaming, capped temp 1.0)
│  │     │  ├─ deepseek.py          DeepSeek (streaming, remaps 0-1 → 0-2 temp)
│  │     │  └─ ollama.py            Ollama local (OpenAI-compat endpoint)
│  │     ├─ prompts/
│  │     │  ├─ cv.py                CV prompt builder
│  │     │  └─ cover_letter.py      Cover letter prompt builder
│  │     ├─ workers.py              CVGenerationWorker, CoverLetterWorker (QThread)
│  │     ├─ ollama_installer.py     Downloads and installs Ollama
│  │     └─ ollama_manager.py       Manages local Ollama process lifecycle
│  └─ ui/
│     ├─ main_window.py
│     ├─ theme.py                   Theme dataclass + ThemeManager singleton
│     ├─ pages/                     Top-level pages
│     ├─ dialogs/                   Modal dialogs
│     ├─ windows/                   Non-modal secondary windows
│     └─ widgets/                   Reusable components
│        ├─ queenie/                Queenie subsystem widgets
│        ├─ cards/                  Card widgets (job, cv, stat, photo, etc.)
│        └─ buttons/                Styled button variants
└─ tools/
   ├─ models/                       ESRGAN .bin/.param + ONNX depth model
   └─ realesrgan-ncnn-vulkan.exe    Real-ESRGAN binary (Vulkan GPU)
```

---

## Core Systems

### Config & Path Resolution

`src/core/config.py` is the single source of truth for all filesystem paths. It handles the frozen/dev split cleanly so no path logic leaks into other modules.

```python
IS_FROZEN = getattr(sys, "frozen", False)   # True when running from PyInstaller bundle
DEV_MODE  = not IS_FROZEN

# User-writable data:
# Dev:    <project>/data/
# Frozen: %APPDATA%/MyCareerKit/   (Windows) | ~/.mycareerkit/  (other)

BASE_DIR     = PROJECT_ROOT / "data"          # dev
BASE_DIR     = Path(os.environ["APPDATA"]) / "MyCareerKit"  # frozen/Windows

# Read-only bundled assets:
BUNDLE_DIR   = Path(sys._MEIPASS)   # PyInstaller extraction dir (frozen only)
MUSIC_DIR    = _asset_path("data/music")
QUEENIE_DATA_DIR = _asset_path("data/queenie")
ESRGAN_EXE   = TOOLS_DIR / "realesrgan-ncnn-vulkan.exe"
```

`ProfilePaths` is a dataclass that holds all per-profile paths derived from a profile stem (e.g. `christian_bergstrom`). `ensure_all()` creates all directories. Nothing in the app constructs raw paths inline — it always goes through `get_profile_paths(stem)`.

Logging is configured in `setup_logging()` with a rotating file handler (in `LOGS_DIR`) and a stream handler. The app-wide logger namespace is `MyCareerKit.*`.

---

### Profile System

`src/core/profile_manager.py`

Profiles are directories under `PROFILES_DIR`. The folder name is a sanitized version of the display name (lowercased, spaces → underscores, unicode stripped). Each folder contains:

```
christian_bergstrom/
├─ profile.json          All profile data (contact, experience, skills, etc.)
├─ saved_jobs.json       List of favourited job postings
├─ cvs/                  Generated CV files (.html, .pdf, .thumb.png)
├─ letters/              Generated cover letters (.txt)
├─ photos/               Uploaded and processed photos
└─ queenie_diary.json    Queenie's diary entries for this profile
```

`ProfileManager` methods:

| Method | Description |
|---|---|
| `create(name)` | Creates folder + empty `profile.json` |
| `save(stem, data)` | Full overwrite of `profile.json` |
| `merge(stem, partial)` | Deep merge into existing profile data |
| `load(stem)` | Returns profile dict |
| `save_job(stem, job_dict)` | Appends to `saved_jobs.json` |
| `remove_job(stem, annons_id)` | Removes by Arbetsförmedlingen ID |
| `get_saved_jobs(stem)` | Returns list of saved job dicts |
| `is_job_saved(stem, annons_id)` | Boolean check |
| `get_stats(stem)` | Returns counts (saved jobs, CVs, letters) for dashboard |

At startup, `ProfilePickerDialog` lists all profile folders, shows a card per profile, and blocks until the user picks one or creates a new one. The selected stem is passed to `MainWindow` and held for the session. Switching profiles relaunches the main window.

---

### LLM Layer

`src/services/llm/`

All LLM interaction is behind two abstractions:

**`BaseLLMClient`** — two methods all clients must implement:
- `stream(prompt, temperature, chunk_callback)` — single-turn, takes a plain string prompt
- `chat(system, messages, temperature, chunk_callback)` — multi-turn with system prompt + history

**`GenerationRequest`** — a parameter object that packages everything needed for a generation call: profile dict, optional target job, language, style, layout, complexity, temperature, custom instructions, photo path, and inclusion flags.

**Clients:**

| Client | Backend | Notes |
|---|---|---|
| `AnthropicClient` | `anthropic` SDK | Temperature hard-capped at 1.0 (API limit). Uses `claude-sonnet-4-6`, max 32768 tokens |
| `DeepSeekClient` | `requests` (raw) | OpenAI-compat endpoint. Temperature remapped: `UI 0–1 → DeepSeek 0–2`. Max 8024 tokens |
| `OllamaClient` | `requests` (raw) | OpenAI-compat `/v1/chat/completions` on localhost. No auth. 300s timeout for slow local inference |

All three implement the same streaming loop: `requests.post(..., stream=True)`, iterate SSE lines, parse `data: {...}`, extract `delta.content`, call `chunk_callback` per chunk, accumulate into full string, return.

**Workers** (`workers.py`) wrap clients in `QThread` subclasses so generation never blocks the UI:

```python
class CVGenerationWorker(QThread):
    chunk_ready = Signal(str)   # streams raw chunks for the debug view
    finished    = Signal(str)   # full HTML when done
    error       = Signal(str)

class CoverLetterWorker(QThread):
    chunk_ready = Signal(str)
    finished    = Signal(str)
    error       = Signal(str)
```

`get_client(provider, api_key, model, base_url)` is a factory that instantiates the right client. The registry is a plain dict:

```python
CLOUD_PROVIDERS = {
    "DeepSeek": (DeepSeekClient, "DEEPSEEK_API_KEY"),
    "Claude":   (AnthropicClient, "ANTHROPIC_API_KEY"),
}
```

**Ollama management** — `ollama_manager.py` handles starting/stopping the local Ollama process and checking if it's running. `ollama_installer.py` can download and install it from the Settings > Local AI tab.

---

### CV Generator

`src/services/llm/prompts/cv.py` + `src/ui/windows/cv_generator_window.py`

| Dark | Light |
|---|---|
| ![CV Generator Dark](https://i.imgur.com/m0aA1bj.png) | ![CV Generator Light](https://i.imgur.com/n5wksyc.png) |

The CV is generated as a **complete self-contained HTML file** with all CSS embedded. No Jinja2. No templates. The LLM produces the entire document from a structured prompt.

**Prompt construction** assembles a large instruction string from multiple helper functions:

```python
_cv_style_instructions(style)       # Professional / Creative / Minimal / Modern / Tech / Nordic / Academic / Designer / Warm
_cv_layout_instructions(layout)     # single_column / two_column / sidebar / ats_safe
_cv_complexity_instructions(complexity)  # web / print / ats
_cv_photo_instruction(photo_path)   # injects __PHOTO_BASE64__ token or forbids photo space
```

After generation completes, `__PHOTO_BASE64__` is replaced with the actual base64-encoded image data in a post-processing step.

**ATS mode** forces `style = "minimal"`, `layout = "ats_safe"`, `complexity = "ats"` regardless of other settings. ATS layout instructions forbid floats, grid columns, tables, and any decorative elements.

**Print complexity** forces 794px width, no `max-width`, no `margin: auto` — the output is sized for direct A4 PDF rendering, not a browser viewport.

**The generator window** (`CvGeneratorWindow`) is a `QWidget` with:
- Left panel: collapsible settings sections (provider, temperature, language, style, layout, complexity, content inclusions, target job picker, freeform instructions)
- Right panel: `QWebEngineView` live preview that updates as chunks stream in
- Bottom: raw debug strip showing streaming output

Generated files are timestamped and saved to the profile's `cvs/` folder as `.html`. A thumbnail (`.thumb.png`) is generated separately via `ThumbnailGenerator` for display in the CV Gallery.

PDF export uses Playwright (`pdf_converter.py`) to headlessly render the HTML to an A4 PDF — same file stem, `.pdf` extension.

---

### Cover Letter Generator

| Dark | Light |
|---|---|
| ![CV Letter Generator Dark](https://i.imgur.com/mrHyu2m.png) | ![Cover Letter Generator Light](https://i.imgur.com/PwPbMAZ.png) |

`src/services/llm/prompts/cover_letter.py` + `src/ui/windows/cover_letter_window.py`

Same architecture as the CV generator. `CoverLetterWorker` → `build_cover_letter_prompt(request)` → streams plain text → displayed in `LetterEditor`.

`LetterEditor` is a themed `QTextEdit` with a word/character count footer and `append_chunk()` for streaming. Font is forced to Georgia 11pt — deliberately serif for a letter-appropriate feel.

Generated letters are saved as `.txt` files in the profile's `letters/` folder and appear in the Letters tab.

---

### Job Search

| Dark | Light |
|---|---|
| ![Job Search Dark](https://i.imgur.com/9rhVEPz.png) | ![Job Search Light](https://imgur.com/YX8vlAN.png) |

`src/services/job_service.py`

`ArbetsformedlingenClient` wraps the [JobTech Dev search API](https://jobsearch.api.jobtechdev.se). Free, no auth required.

```python
BASE_URL = "https://jobsearch.api.jobtechdev.se/search"
params = {
    "q":      f"{query.strip()}*",   # wildcard appended for broader matching
    "limit":  min(limit, 100),
    "offset": offset,                # pagination
}
```

Results are normalized into `JobCardData` objects. A `JobSearchWorker(QThread)` runs the network call off the UI thread. Pagination is handled by `PaginationBar` with offset-based navigation.

`JobCard` widgets display each result. The heart/save button uses a custom low-poly faceted triangle renderer (not an SVG icon, not a font icon — raw `QPainter` polygon drawing with per-facet alpha variation).

Saved jobs are stored in `saved_jobs.json` per profile and are available as a target selector in both generator windows.

### Job Details Window

| Dark | Light |
|---|---|
| ![Job Details Dark](https://i.imgur.com/mnCYrlO.png) | ![Job Details Light](https://i.imgur.com/KDPfIJJ.png) |

**`JobDetailsWindow`** (`src/ui/windows/job_details_window.py`) opens as a separate `Qt.WindowType.Window` when a card is clicked. It is composed of three internal widgets:
 
- `_JobHeader` — custom `paintEvent` drawing the employer logo placeholder (initials in a circle), job title, employer and location subtitle, the geometric heart save button, and a close button that turns red on hover. Header background uses a horizontal `QLinearGradient` for a subtle depth effect.
- `_MetaRow` — a fixed-height pill widget that renders published date, apply-before deadline, salary, and location as evenly-spaced labeled columns with divider lines between them, all drawn with `QPainter`.
- `_ActionBar` — bottom bar with an "Open Listing" button (opens the Arbetsförmedlingen URL in the system browser via `webbrowser.open`) and a "Generate Cover Letter" button that emits a signal back to the job search page to launch `CoverLetterWindow` pre-loaded with the job.
The scrollable body between header and action bar renders contact info (if present), a requirements section, and the full job description. All text labels are selectable with the mouse (`TextSelectableByMouse`).
 
---

### Photo Toolkit

| Dark | Light |
|---|---|
| ![Photo Toolkit Dark](https://imgur.com/FA3G8R1.png) | ![Job Details Light](https://imgur.com/XnH1RgD.png) |

`src/services/photo_workers.py` + `src/ui/windows/photo_toolkit_window.py`

All processing runs on `QThread` worker subclasses with `finished(pil_img, elapsed)`, `error(str)`, and `progress(str)` signals. Workers:

| Worker | What it does |
|---|---|
| `UpscaleWorker` | Calls `realesrgan-ncnn-vulkan.exe` via `subprocess`. Three model options (x4plus general, x4plus anime, animevideov3). Temp files in/out, cleaned up after |
| `RemoveBGWorker` | Runs on the PIL image. Outputs RGBA PNG |
| `ReplaceBGWorker` | Pastes RGBA image onto a solid color background. Expects RGBA input (run rembg first) |
| `BokehWorker` | Runs ONNX depth model (`model.onnx` via `onnxruntime`) to estimate a depth map, then applies Gaussian blur weighted by depth. `blur_amount` and `focus_depth` are user-controlled |
| `CorrectionsWorker` | `PIL.ImageEnhance` for brightness, contrast, saturation, sharpness. Debounced via `QTimer` at 150ms — slider moves don't fire a new worker on every tick |

History is a list of PIL images. Undo pops and restores. Reset goes back to the original source.

The before/after view uses custom `QWidget` paint widgets that draw PIL images scaled to fit. Status bar at the bottom shows elapsed time and output resolution after each operation.

Photo is saved to `profile/photos/` and embedded in CVs as base64.

---

### Queenie — AI Assistant

`src/ui/widgets/queenie/`

Queenie is a collapsible side panel housing a full multi-turn AI assistant. The system is composed of several layers:

**`QueenieBrain`** (`queenie_brain.py`) — the core engine. A `QObject` that:
- Maintains a `BrainState` (history as `list[Message]`, user name, persona file, developer flag)
- On `send(user_message)`: appends message, queries the lorebook, builds system prompt, spins up a `_LLMWorker(QThread)` to call the LLM, emits `response_ready` when done
- History is capped at `MAX_HISTORY = 30` messages
- Switching `persona_file` clears history

**Persona system** (`character_card.py`) — personas are JSON files in `data/queenie/personas/`:

```json
{
  "name": "Queenie",
  "alias": "Queenie",
  "emoji": "👑",
  "greeting": "Heey {name}!...",
  "description": "You are Queenie...",
  "example_dialog": "..."
}
```

`build_system_prompt(user_name, persona_file, extra_context)` loads the persona card, substitutes `{name}`, appends example dialog, and appends any lorebook-injected context. The resulting string is the `system` parameter for every `chat()` call.

Two default personas ship: `queenie.json` (the main assistant character) and `christian.json` (the developer persona, "The Manager").

**Lorebook system** (`lorebook_data.py`) — each lorebook is a JSON file containing entries with `keywords` arrays and `content` strings. On every user message, `get_matching_entries(user_message, is_developer)` checks if any keyword appears in the lowercased message and returns matching content blocks. These are concatenated and injected into the system prompt under `## WHAT YOU KNOW RIGHT NOW`. This gives Queenie accurate knowledge of app features without baking it all into the base persona.

```json
{
  "id": "cv_generator",
  "keywords": ["cv", "resume", "curriculum"],
  "content": "CV GENERATOR: Opens as a separate window...",
  "priority": 10
}
```

**`QueenuePanel`** assembles `QueenieBrain` + `QueenieChatArea` + `QueenueInputRow` + `QueenueHeader`. Navigation context is injected via `set_tab_context(tab_name)` when the user switches pages — Queenie silently receives a system-role message so she knows where the user is in the app.

The `!diary write` and `!diary read` commands are intercepted in `QueenuePanel._on_user_message` before being forwarded to the brain.

---

### Diary System

`src/ui/widgets/queenie/diary_service.py`

`DiaryService` manages a per-profile `queenie_diary.json` containing chronological diary entries written *by Queenie* in character.

`request_entry()`:
1. Determines the current day number (entry count + 1)
2. Loads the last `MAX_CONTEXT_ENTRIES = 3` diary entries as context
3. Constructs a prompt asking Queenie to write in "reality TV confessional" voice, starting with `Day N.`
4. Connects a one-shot handler to `brain.response_ready` to capture the next response
5. Calls `brain.send(prompt)` — Queenie writes the entry as her next chat response

The resulting text is saved as a structured entry:

```json
{
  "day_number": 1,
  "date": "2026-04-17",
  "entry": "Day 1. Okay so..."
}
```

`!diary read` in chat shows the last 3 entries formatted inline.

---

### Media Player

`src/ui/widgets/media_player_bar.py`

A persistent bar docked at the bottom of `MainWindow`. Audio backend is `pygame.mixer` — QtMultimedia was evaluated and dropped. Qt handles nothing audio-related here; it only drives the UI.

Startup sequence: `pygame.mixer.init()` runs at module level (mixer only — no display, no event system). If it fails, `_MIXER_OK = False` and the widget renders silently without crashing. Track duration is read via `mutagen` since pygame doesn't expose it. A `QTimer` at 100ms ticks `_tick()` which calls `pygame.mixer.music.get_busy()` to detect end-of-track and advance the playlist.

Seek position is tracked manually — pygame doesn't expose a reliable position query. The widget maintains `_seek_base` (accumulated ms from previous segments) and `_play_start` (a `time.perf_counter()` timestamp for the current segment). Current position = `_seek_base + (now - _play_start) * 1000`.
 
Controls: shuffle, previous, play/pause, next, seek bar, volume slider. All drawn with `QPainter` — no standard Qt controls. Title scrolls horizontally when it overflows the allocated width, driven by a second `QTimer` at 35ms.
 
The soundtrack was produced with Suno AI by Christian. Genres: cyberpunk lofi, drum & bass, house, tech house, pop, hiphop, metal, psydub, psybient. All tracks are thematically about job hunting.

---

## UI Architecture

The UI layer (`src/ui/`) follows a component model built on PySide6 with manual `QPainter`-based custom drawing where Qt's standard widgets aren't expressive enough.

**Pages** (`pages/`) are `QWidget` subclasses, not `QDialog`. They're swapped in/out by `MainWindow` using a `QStackedWidget`. Page navigation is handled by `SideMenu` emitting signals.

**Tabs** within pages use a custom `ProfileSubNav` widget (not `QTabWidget`) for visual consistency. Tab content is also swapped via stacked layout.

**Windows** (`windows/`) are top-level `QWidget` instances with `Qt.WindowType.Window`. They're created on demand and closed independently.

**Dialogs** (`dialogs/`) are `QDialog` subclasses used for blocking interactions (profile picker, content selector).

**Cards** are `QWidget` subclasses that override `paintEvent` for custom rendering. `JobCard`, `CvCard`, `StatCard`, `PhotoCard`, etc. all draw themselves directly with `QPainter`.

**`AnimatedLogoWidget`** is a general-purpose animated text widget used across the app for window titles and section headers — `"MyCareerKit"`, `"CV Generator"`, `"Cover Letter"`, etc. It takes a `text` string, a `split` int (number of leading characters rendered in `text_secondary`, remainder in `text_primary`), and a `font_size`. The animation is a letter-by-letter typewriter effect driven by a `QTimer` at 16ms (~60fps): characters fade in sequentially, the last typed character briefly glows in the accent color, and after completion the widget idles for 30–60 seconds before fading out and replaying. `set_text()` can swap the text at runtime and trigger a replay.

---

### Dashboard

The landing page after profile selection. Composed entirely of custom-painted widgets — no standard Qt labels or layout widgets are visible to the user.
 
`_GreetingWidget` paints a time-aware greeting (`Good morning/afternoon/evening`) with the profile's first name. The greeting prefix is painted in `text_secondary` at `font_size_xxl` weight light, and the name continues on the same baseline in `text_primary` weight medium — two separate `drawText` calls with manual x-offset calculated from `QFontMetrics.horizontalAdvance`.
 
Four `StatCard` widgets show counts for saved jobs, CVs generated, cover letters, and applications. These are live-updating — `DashboardPage.refresh()` calls `ProfileManager.get_stats()` and pushes new values to each card without rebuilding the layout.
 
`_RecentItemRow` paints recent file activity — a colored badge pill on the left (CV / Letter), filename, and date. Recent items are read from `get_stats()` which scans the `cvs/` and `letters/` folders and returns the most recent files sorted by mtime.
 
The page background has a subtle `QRadialGradient` glow in the accent color (alpha 12) emanating from the top-right corner, painted in `paintEvent`.

---
 
### Profile Tabs
 
`src/ui/pages/profile_page.py` + `src/ui/pages/profile_tabs/`
 
Navigation between tabs is handled by `ProfileSubNav` — a custom painted horizontal nav bar, not `QTabWidget`. Each tab owns a specific subset of keys in `profile.json` (declared as `OWN_KEYS`) and handles its own load/save independently via `ProfileManager.merge()`, so tabs don't overwrite each other's data.
 
#### Contact Tab

Contact Tab (`contact_tab.py`) — owns `name`, `title`, `email`, `phone`, `city`, `website`, `summary`, `photo`. Fields are `StyledLineEdit` and `StyledTextArea` widgets grouped inside `SectionCard` containers. The photo field uses `PhotoUploadWidget` — a drop zone that accepts drag-and-drop or file browser, displays a preview, and on save copies the file into `profile/photos/` storing only the filename in JSON. A `CountLabel` shows character count on the summary field.

#### Experience Tab

Experience Tab (`experience_tab.py`) — owns `work`, `education`, `references`. Each section is a `DynamicSection` widget: a custom-painted container that holds a variable number of collapsible `EntryCard` widgets. `DynamicSection` paints its own section title header and an "Add entry" button at the bottom (also painted, not a real button — `mousePressEvent` handles the click). Entries are auto-numbered (#1, #2...). `EntryCard` is a collapsible form card with a field schema (`WORK_FIELDS`, `EDUCATION_FIELDS`, `REFERENCE_FIELDS`) that drives which inputs are rendered. Fields support a painted delete button on hover.

#### Skills Tab

Skills Tab (`skills_tab.py`) — owns `skills`, `languages`, `licenses`. Skills and languages use `SkillChipInput` — a chip-based tag input where each chip has a level badge that cycles through 4 levels on click (Beginner → Intermediate → Advanced → Expert for skills, Basic → Conversational → Professional → Native for languages). Level colors come from theme properties `level_1` through `level_4`. A `LevelLegend` widget painted below each input shows the color-to-label mapping. Licenses use a `LicenseGrid` — a fixed grid of toggleable license/certification checkboxes.

#### CV Gallery Tab

CV Gallery Tab (`cv_gallery_tab.py`) — a responsive grid of `CVCard` widgets, each showing a thumbnail preview of a generated CV. Column count recalculates on resize via a debounced `QTimer` (150ms). Thumbnails are generated by `ThumbnailWorker` (Playwright, background thread) after each CV generation and cached as `.thumb.png` files. Clicking a card opens `CVViewerDialog` showing the full thumbnail. Each card also has a PDF export button that triggers `PdfConvertWorker`. A `FolderButton` in the toolbar opens the `cvs/` folder in the system file explorer. Empty state is a custom-painted `EmptyGalleryState` widget.

#### Letters Tab

Letters Tab (`letter_tab.py`) — scrollable list of saved cover letters. Each row shows the letter name, generation date, and a truncated first line as preview. Clicking opens `LetterViewerWindow`. Delete button appears on hover.

#### Saved Jobs Tab

Saved Jobs Tab (`saved_jobs_tab.py`) — mirrors the job search card view but reading from `saved_jobs.json` instead of the API. Has a `SearchBar` for local filtering across saved jobs. Inline unsave (heart toggle) syncs back to disk immediately via `ProfileManager.remove_job()`. Emits `job_selected` signal which `MainWindow` wires to open `JobDetailsWindow`.

#### Photo Tab

Photo Tab (`photo_tab.py`) — displays the current profile photo and a button to launch `PhotoToolkitWindow`. When `PhotoToolkitWindow` emits `photo_saved`, the tab reloads and updates the preview. Acts as the bridge between the toolkit window and the profile.
 
---
 
### Settings Pages
 
`src/ui/pages/settings_page.py` + `src/ui/pages/settings_tabs/`
 
**Appearance Tab** (`appearance_tab.py`) — theme selection via `ThemeRadioGroup`, a custom-painted radio button group. Currently exposes Dark and Light. Selecting a theme calls `ThemeManager.set()` immediately (live switch, no restart) and persists the choice via `QSettings`. The `_save_theme_preference` / `load_saved_theme` functions are the only place `QSettings` is used in the app.
 
**API Keys Tab** (`api_keys_tab.py`) — manages `ANTHROPIC_API_KEY` and `DEEPSEEK_API_KEY`. Each key is an `_ApiKeyRow`: a password-masked `StyledLineEdit` with a Show/Hide toggle. On save, keys are written to `BASE_DIR/.env` and reloaded into the process environment with `load_dotenv(override=True)` so changes take effect immediately without restarting. Keys are read from `os.environ` on widget init so the current values pre-populate the fields.
 
**Local AI Tab** (`local_ai_tab.py`) — the most complex settings tab. Manages the full Ollama lifecycle:
 
- A `_StatusDot` (painted colored circle) shows whether the Ollama daemon is running — grey (unknown), green (running), red (not running). Status is checked via `OllamaCheckWorker` on tab open and on a periodic poll.
- Install/Uninstall Ollama via `OllamaInstallWorker` / `OllamaUninstallWorker` (downloads from the official source, runs installer).
- A curated list of 5 models (`llama3.2`, `mistral`, `phi3`, `qwen2.5:7b`, `gemma2:2b`) with size and VRAM requirements displayed. Each is a `_ModelRow` with Pull / Delete buttons wired to `OllamaPullWorker` / `OllamaDeleteWorker`.
- Pull progress is streamed in real time — `OllamaPullWorker` emits `progress(str)` chunks which update a status label as the model downloads layer by layer.
- Qwen 2.5 7B is specifically noted for strong Swedish language support — relevant given the app's target market.
---

## Theming

`src/ui/theme.py`

`Theme` is a dataclass holding all color, font, and spacing values as `QColor` and `str` instances. `ThemeManager` is a singleton that holds the active theme and emits a `theme_changed` signal via a `QObject`-based `_Signals` class.

All widgets connect to `ThemeManager.signals.theme_changed` in their `__init__` and call `self.update()` / re-apply stylesheets on the slot. This means theme switching is live — no restart required.

Themes are defined as static factory methods. The selected theme is persisted to `settings.json` and restored at startup before any window is created:

```python
from src.ui.pages.settings_page import load_saved_theme
from src.ui.theme import ThemeManager
ThemeManager.set(load_saved_theme())
```

Custom tool colors (upscale, rembg, bokeh, etc.) are theme properties, so they adapt to light/dark themes.

---

## Data Storage

Everything is flat files. No database.

| File | Format | Contents |
|---|---|---|
| `profile.json` | JSON | Contact info, experience, education, skills, languages, summary |
| `saved_jobs.json` | JSON array | Full job card data for each favourited listing |
| `queenie_diary.json` | JSON array | Queenie's diary entries |
| `settings.json` | JSON | App-wide settings (theme, active profile, API keys flag, Ollama config) |
| `.env` | dotenv | `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY` — never bundled, loaded from `BASE_DIR` |
| `*.html` | HTML | Self-contained CV with all CSS and photo base64-embedded |
| `*.pdf` | PDF | Playwright-rendered A4 PDF of the CV HTML |
| `*.thumb.png` | PNG | Thumbnail for CV gallery display |
| `*.txt` | Plain text | Cover letters |
| `lorebook_*.json` | JSON | Queenie lorebook entries with keyword arrays |
| `queenie.json` / `christian.json` | JSON | Persona cards |

---

## Build & Distribution

`BUILD.md` documents the full PyInstaller build process. Key concerns:

- **`multiprocessing.freeze_support()`** must be called before any Qt import — PySide6's `QWebEngineView` spawns child processes on Windows, which will fork-bomb a frozen app without it
- **`QWebEngineProcess.exe`** must be bundled and discoverable. `_apply_frozen_env()` in `main.py` sets `QTWEBENGINEPROCESS_PATH` from `sys._MEIPASS` when frozen
- **Playwright** browsers ship in a `_playwright/` folder inside the bundle; `PLAYWRIGHT_BROWSERS_PATH` is set accordingly
- **User data** (`%APPDATA%/MyCareerKit/`) is never inside the bundle — the `.env` file and all profile data live outside. `BASE_DIR` switches automatically between `data/` (dev) and `%APPDATA%/MyCareerKit/` (frozen)
- **Music and Queenie data** are read-only bundled assets and are never copied to `%APPDATA%`
- **`realesrgan-ncnn-vulkan.exe`** and its models are bundled under `tools/`
- GPU rasterization is force-enabled via Chromium flags: `--enable-gpu-rasterization --enable-zero-copy`

---

## Dependencies

Core:

```
PySide6                  Qt6 bindings — UI and web engine (no QtMultimedia used)
pygame                   Audio backend for the media player (mixer only)
mutagen                  Audio metadata — track duration reading
requests                 HTTP client for all API calls
python-dotenv            .env loading
Pillow                   Image processing throughout
anthropic                Official Anthropic SDK (streaming)
```

Photo toolkit:

```
rembg[cpu]               Background removal (lazy import — only loaded when used)
onnxruntime              ONNX inference for depth model (bokeh)
numpy                    Array ops for depth map processing
```

PDF:

```
playwright               Headless Chromium for HTML-to-PDF
```

Packaging:

```
pyinstaller              Frozen build
```

---

## Environment Variables

Stored in `BASE_DIR/.env` (never in the repository):

```
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
```

Loaded at startup via `load_dotenv(BASE_DIR / ".env")` before any LLM client is constructed. Keys are read with `os.getenv()` at the point of client instantiation, not at import time.

Ollama needs no key — it runs locally. The base URL defaults to `http://localhost:11434` and is overridable in Settings > Local AI.

---

## Developer Notes

**Adding a new LLM provider:**
1. Subclass `BaseLLMClient` in `src/services/llm/clients/`
2. Implement `stream()` and `chat()`
3. Register in `workers.py` `CLOUD_PROVIDERS` dict
4. Add to the provider dropdown in `CvGeneratorWindow` / `CoverLetterWindow`

**Adding a new Queenie persona:**
Drop a JSON file in `data/queenie/personas/`. Required keys: `name`, `greeting`, `description`. Optional: `alias`, `emoji`, `example_dialog`. It will appear in the persona switcher automatically via `list_personas()`.

**Adding a new lorebook:**
Add entries to `data/queenie/lorebooks/lorebook_app.json` or create a new lorebook file. `get_matching_entries()` loads all lorebook files in the directory. Priority field controls injection order when multiple entries match.

**Theming a new widget:**
Connect to `ThemeManager.signals.theme_changed` in `__init__`, store the theme, update in the slot. Don't access `ThemeManager.get()` in `paintEvent` — cache it and refresh on signal.

**`rembg`** — it has a heavy dependency chain and slow first-run model download. It is intentionally not imported at module level. `RemoveBGWorker.run()` imports it inside the thread.

**The `temp_files_delete_when_you_got_balls/` folder** contains an older monolithic `llm_service.py` that was the precursor to the current split client/worker architecture. It exists for reference and is not imported anywhere.