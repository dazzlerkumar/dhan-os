# Design Specification: Loud Analytics Dashboard UI

Document defines visual hierarchy, page layout structure, navigation bar, and component specifications derived from dashboard reference interface.

## Overview

- **Location**: [layout.tsx](file:///Users/deepak/Projects/dhan-os/src/app/(main)/layout.tsx), [page.tsx](file:///Users/deepak/Projects/dhan-os/src/app/(main)/page.tsx)
- **Purpose**: Financial analytics dashboard providing cashflow tracking, activity distribution, and transaction overview.
- **Visual Theme**: Dark mode, low-contrast dark slate canvas (`#0A0A0C`), elevated card containers (`#141417`), high-contrast electric violet (`#7C3AED`) and chartreuse green (`#BEF264`) accents.

---

## Page Layout Architecture

Overall page employs vertical stack with full-width top navigation bar, header control band, middle metric hero band, and 3-column bottom dashboard grid.

```
+---------------------------------------------------------------------------------+
| Navigation Bar: [Brand Logo | Nav Pills: Dashboard/Analytics/... | Search/Alert/User] |
+---------------------------------------------------------------------------------+
| Header Row: "Welcome back, Angela"             | Time Filter: [Week | Month | Year] |
+---------------------------------------------------------------------------------+
| Hero Metrics Row:                                                               |
| [Total Revenue & Action CTAs]       | [Average Baseline & Category Volume Bars] |
+---------------------------------------------------------------------------------+
| Bottom Section (3-Column Grid):                                                 |
| [Analytics: Income vs Expenses] | [Activity Heatmap Grid] | [Recent Transactions] |
+---------------------------------------------------------------------------------+
```

### Layout Structure Mapping

- App layout container in [layout.tsx](file:///Users/deepak/Projects/dhan-os/src/app/(main)/layout.tsx) hosts top navigation header and scrollable viewport container.
- Page content in [page.tsx](file:///Users/deepak/Projects/dhan-os/src/app/(main)/page.tsx) renders dashboard main canvas with max-width bounding box, internal gap spacing (`gap-6`), and responsive grid layout.

---

## 1. Top Navigation Bar

Sticky/fixed top app bar spanning full container width.

### Elements

1. **Brand Identity (Left)**:
   - Gradient circular icon: radial blend from electric purple to white.
   - Brand name: "Loud" in bold sans-serif type (`text-lg font-bold text-white`).
2. **Central Pill Navigation (Center)**:
   - Enclosed pill container (`bg-[#1C1C20] rounded-full p-1 border border-white/5`).
   - Tab items:
     - `Dashboard`: Inactive (`text-zinc-400 hover:text-white px-4 py-1.5`).
     - `Analytics`: Active state (`bg-white text-black font-medium rounded-full px-4 py-1.5 shadow-sm`).
     - `Transactions`: Inactive.
     - `Reports`: Inactive.
     - `Settings`: Inactive.
3. **Utility Controls & Profile (Right)**:
   - Search trigger button: Circular icon button (`w-9 h-9 rounded-full bg-[#1C1C20] text-zinc-300`).
   - Notification trigger button: Circular icon button (`w-9 h-9 rounded-full bg-[#1C1C20] text-zinc-300`).
   - User profile avatar: Circular photo badge (`w-9 h-9 rounded-full overflow-hidden border border-white/10`).

---

## 2. Greeting & Timeframe Filter Row

Header control row directly below navigation bar.

### Elements

1. **User Greeting (Left)**:
   - Text: "Welcome back, Angela".
   - Hierarchy: Heading 1 (`text-3xl font-semibold text-white tracking-tight`).
2. **Interval Toggle (Right)**:
   - Segmented pill container (`bg-[#1C1C20] rounded-full p-1 border border-white/5`).
   - Options:
     - `Week`: Inactive (`text-zinc-400 px-3 py-1 text-sm`).
     - `Month`: Active state (`bg-[#2A2A30] text-white rounded-full px-3 py-1 text-sm font-medium`).
     - `Year`: Inactive (`text-zinc-400 px-3 py-1 text-sm`).

---

## 3. Hero Metrics Section

Two-column section displaying aggregate balance and breakdown metrics.

### Left Panel: Revenue & Quick Actions

- **Metric Label**: "Total revenue" (`text-sm text-zinc-400 font-medium`).
- **Primary Value**: "$16,957.00" (`text-4xl font-bold text-white tracking-tight`).
- **Trend Indicator**: "+12.67%" badge with subtle cyan/teal hue (`text-xs font-semibold text-cyan-400 ml-2 align-middle`).
- **Secondary Metric**: "Available to spend: $16,957.00" (`text-sm text-zinc-400 mt-2`).
- **Action Button Row**:
  - Primary button: "Transfer ^" (`bg-white text-black font-semibold rounded-full px-5 py-2 text-sm flex items-center gap-1.5 hover:bg-zinc-200`).
  - Secondary button: "Request v" (`bg-[#1C1C20] text-white font-medium rounded-full px-5 py-2 text-sm flex items-center gap-1.5 border border-white/10 hover:bg-[#25252A]`).
  - Overflow button: Vertical ellipsis in circular button (`w-9 h-9 rounded-full bg-[#1C1C20] text-zinc-300 border border-white/10 flex items-center justify-center`).

### Right Panel: Distribution & Performance Chart

- **Benchmark Baseline**:
  - Horizontal dashed guideline across panel (`border-t border-dashed border-zinc-700`).
  - Centered badge label: "Average" (`bg-[#2A2A30] text-zinc-300 text-xs px-2.5 py-0.5 rounded-full border border-white/10`).
- **Category Columns**:
  1. **Invest Column**:
     - Metric value: "$4,465.00" (`text-sm font-semibold text-white`).
     - Growth label: "+ 23% Invest" (`text-xs text-zinc-400 mt-1`).
     - Visual display: Solid violet rounded rectangle block (`bg-[#6D28D9] h-14 rounded-lg w-full mt-3`).
     - Time marker: "January 26" (`text-xs text-zinc-500 mt-2`).
  2. **Products Column**:
     - Metric value: "$8,458.70" (`text-sm font-semibold text-white`).
     - Growth label: "+ 12% Products" (`text-xs text-zinc-400 mt-1`).
     - Visual display: Dense vertical frequency bar chart (purple lines, rounded caps, varying heights).
  3. **Other Column**:
     - Metric value: "1.24 Other" (`text-xs text-zinc-400`).
     - Visual display: Muted slate vertical bars.
     - Time marker: "February 26" (`text-xs text-zinc-500 mt-2 text-right`).

---

## 4. Bottom Grid Section

Three equal-width cards in 3-column responsive layout (`grid grid-cols-1 lg:grid-cols-3 gap-6`).

### Card 1: Cashflow Analytics (`Income vs Expenses`)

- **Card Container**: Elevated slate surface (`bg-[#141417] rounded-2xl p-5 border border-white/5`).
- **Card Header**:
  - Left: Line-chart icon + title "Analytics" (`text-base font-semibold text-white`).
  - Right: Context menu button (`...`).
- **Legend Row**:
  - Income marker: Chartreuse square (`w-3 h-3 rounded-sm bg-[#BEF264]`) + "Income" (`text-xs text-zinc-300`).
  - Expenses marker: Muted grey square (`w-3 h-3 rounded-sm bg-zinc-600`) + "Expenses" (`text-xs text-zinc-300`).
- **Chart Visualisation**:
  - Area line chart with smooth cubic bezier curve interpolation.
  - Line 1 (Income): Solid chartreuse (`#BEF264`) stroke with subtle glow; data point dot highlighted at June with popup tooltip "$7,968.00".
  - Line 2 (Expenses): Dashed white/grey stroke; data point dot highlighted at June with popup tooltip "$5,957.00".
  - Vertical crosshair dashed line connecting June data points.
  - X-Axis Labels: "Mar", "Apr", "May", "Jun", "Jul", "Aug" (`text-xs text-zinc-500 flex justify-between`).

### Card 2: Activity by Time Heatmap

- **Card Container**: Elevated slate surface (`bg-[#141417] rounded-2xl p-5 border border-white/5`).
- **Card Header**:
  - Left: Globe icon + title "Activity by time" (`text-base font-semibold text-white`).
  - Right: External navigation link arrow.
- **Heatmap Matrix**:
  - Column Headers: Days of week ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun") (`text-xs text-zinc-500`).
  - Row Labels: Hours of day ("1 pm", "2 pm", "3 pm", "4 pm", "5 pm", "6 pm") (`text-xs text-zinc-500`).
  - Cells: 7x6 matrix of rounded square chips (`rounded-md p-3`).
  - Cell Color Scale:
    - Zero/Base activity: Deep dark purple-navy (`#1E1B4B` / `#181824`).
    - Moderate activity: Medium purple (`#4C1D95` / `#5B21B6`).
    - High activity: Vibrant electric violet (`#7C3AED` / `#8B5CF6`).
    - Peak activity: Light lilac (`#DDD6FE`).
- **Footer Legend**:
  - Horizontal scale label: "Less" -> 4 intensity square swatches -> "More" (`text-xs text-zinc-500 flex items-center gap-1.5`).

### Card 3: Recent Transactions

- **Card Container**: Elevated slate surface (`bg-[#141417] rounded-2xl p-5 border border-white/5`).
- **Card Header**:
  - Left: Transaction exchange icon + title "Recent transactions" (`text-base font-semibold text-white`).
  - Right: Filter/search icon button.
- **Transaction List Items**:
  Row layout: `[Entity Name] | [Category Pill] | [Amount] | [Menu Button]`

  | Entity | Category Tag | Dot Color | Amount | Action |
  | --- | --- | --- | --- | --- |
  | Internet | Multimedia | Yellow (`#EAB308`) | -$40.00 | Context menu |
  | Isabella Garcia | Transfer | Violet (`#8B5CF6`) | -$86.50 | Context menu |
  | Sephora | Beauty | Teal/Cyan (`#06B6D4`) | -$248.80 | Context menu |
  | Netflix | Multimedia | Yellow (`#EAB308`) | -$248.80 | Context menu |
  | Violet Orean | Transfer | Violet (`#8B5CF6`) | +$500.00 | Context menu |

- **Category Tag Styling**:
  - Pill shape (`bg-[#1C1C22] px-3 py-1 rounded-full text-xs text-zinc-300 border border-white/5`).
  - Category status dot: 6px circular indicator preceding tag text.
- **Amount Typography**:
  - Negative values: Neutral/light text (`text-white font-medium`).
  - Positive values: Light green or white text with explicit plus sign (`text-white font-medium`).

---

## 5. Design System Tokens

### Color Palette

| Token | Hex Value | Application |
| --- | --- | --- |
| `background` | `#0A0A0C` | Root page canvas |
| `card-surface` | `#141417` | Card panels |
| `card-border` | `rgba(255, 255, 255, 0.05)` | Card boundary borders |
| `control-surface`| `#1C1C20` | Secondary buttons, pill tabs, search triggers |
| `accent-primary` | `#7C3AED` | Primary brand violet, heatmap peaks, active bars |
| `accent-success` | `#BEF264` | Income trend line, positive metric indicators |
| `text-primary` | `#FFFFFF` | Primary headings, monetary values |
| `text-secondary`| `#A1A1AA` | Labels, subtitles, inactive nav tabs |
| `text-muted` | `#71717A` | Axis labels, captions, grid markers |

### Typography

- Font family: Inter, Geist, or equivalent geometric grotesque sans-serif.
- Weights: Regular (400) for axis/captions, Medium (500) for tabs/transactions, Semibold (600) for card titles/headings, Bold (700) for balance stats.

### Interactive States

- Pill Nav Tabs: Hover increases contrast (`text-white`); active state swaps to inverted solid white background with black text.
- Action Buttons: `Transfer` button uses primary white pill; `Request` uses secondary muted glass pill with hover lift.
- Heatmap Chips: Hover displays tooltip with timestamp and transaction frequency.
