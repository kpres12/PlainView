# Plainview Dashboard - Feature Guide

## 🎮 Quick Controls

### Keyboard Shortcuts
| Action | Shortcut | Effect |
|--------|----------|--------|
| **Command Palette** | `/` or `Cmd+K` | Open searchable command palette |
| **Close Palette** | `Esc` | Hide command palette |
| **Navigate Palette** | `↑ ↓` | Move between commands |
| **Execute Command** | `Enter` | Run selected command |

### Command Palette Commands
- **Inspect Valves** — View valve status across all sites
- **Search Assets** — Find specific assets by name or ID
- **View Missions** — See all active and planned missions
- **Replay Events** — Play back event timeline from any point
- **View Alerts** — See all system alerts and anomalies
- **Analytics** — View FlowIQ analytics and insights

---

## 🎛️ Main Dashboard (Command Center)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Navbar: Plainview | Nav Buttons | Multi-Site View | Status   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Fleet Status  │   3D Map     │  Telemetry                   │
│                │  Placeholder │                              │
│  • Pumpjack-1  │              │  Pressure: 245 PSI           │
│  • Valve-3401  │              │  Temperature: 72°C           │
│  • Pipeline-B  │              │  Flow Rate: 1,245 bbl/day    │
│                │              │                              │
├─────────────────────────────────────────────────────────────┤
│ Event Timeline (Scrollable)                                  │
│ [14:32] ✓ Valve V-3401 pressure stabilized                  │
│ [14:28] ⚠ High flow detected on Pipeline-B (+8%)            │
│ [14:25] • System checkpoint saved                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Alert System

### Features
- **Toast Notifications**: Slide in from top-right, auto-dismiss after 5-10 seconds
- **Severity Levels**:
  - 🔴 **Error** (red) — Critical failures requiring immediate action
  - 🟠 **Warning** (amber) — Anomalies needing attention
  - 🟢 **Success** (green) — Mission/action completed successfully
  - 🔵 **Info** (blue) — General status updates

### Behavior
- Click alert to dismiss manually
- All alerts auto-log to Event Timeline
- Stack up to 5 alerts on screen, older ones fade out
- Persistent until dismissed or timeout

---

## 💬 FlowIQ AI Assistant

### Access
- Click floating **message circle** button (bottom-right)
- Type natural language questions
- Receive AI-powered insights

### Sample Interactions
- _"Why is pressure high on Pipeline-B?"_
  → Analyzes recent telemetry, returns anomaly analysis
  
- _"Recommend maintenance priorities"_
  → Scans asset health scores, returns ranked list
  
- _"Show me efficiency opportunities"_
  → Compares baselines, suggests optimizations

### Initial Insights Panel
- **Anomaly Detected**: Valve V-3401 pressure deviation +12%
- **Efficiency Insight**: Flow optimization possible on Pipeline-B (+8%)
- **Maintenance Alert**: Pump P-2101 predictive maintenance in 14 days

---

## 🗺️ Multi-Site Operations

### Global Inset Map
- **Visual**: Miniature US map with 4 site indicators
- **Colors**: Green (healthy), Amber (warning), Red (critical)
- **Sites**: 
  - 🟢 Permian Basin (Texas) — 24 assets
  - 🟠 Eagle Ford (South Texas) — 18 assets (warning)
  - 🟢 Bakken (North Dakota) — 12 assets
  - 🔴 Marcellus (Pennsylvania) — 16 assets (critical)

### Site Switcher
- Click map or dropdown to see all sites
- Each site shows: Name, location, asset count, status dot
- Selecting a site updates the main dashboard view

---

## 🎬 Mission Builder

### Access
Navigate to **MISSIONS** view via navbar

### Building Missions
1. **Drag** an asset from left sidebar
2. **Drop** into the "Mission Timeline" area
3. **Configure step**:
   - Select action: open, close, inspect, actuate
   - Set duration: 5-300 seconds
   - Edit or delete steps before execution
4. **Execute** when ready

### Timeline Display
- Each step shows: number → asset name → action → duration
- Steps execute sequentially
- Real-time progress with cinematic camera pans

---

## 🎥 Cinematic Transitions

### Triggered By
- Mission execution
- Asset navigation
- Multi-site switches

### Visual Effects
- **Camera Pan**: Smooth interpolation between viewpoints
- **Black Bars**: Top/bottom cinematic letterbox effect
- **Progress Bar**: Shows % completion and estimated time
- **Overlay Info**: Displays current camera position (X, Y, Z)

### Duration
- Typically 2-5 seconds per transition
- Camera path calculates 3D route between targets
- Smooth easing with cubic-bezier interpolation

---

## 📊 Event Timeline

### Display
- Scrollable log at bottom of Command Center
- Each entry shows timestamp + icon + message

### Entry Types
- 📍 **Telemetry** — Sensor data updates (dark gray)
- 🎯 **Action** — Valve actuations, missions completed (amber)
- 🚨 **Alert** — Anomalies logged (colored by severity)

### Viewing Details
- Click event to expand details
- Hover to see full message
- Right-click to filter by type

---

## 🔧 Status Indicators

### Navbar Status (Right)
```
● ONLINE — System connected and operational
```

### Asset Status Badges
- 🟢 **Healthy** — Normal operation
- 🟠 **Warning** — Performance degradation or anomaly
- 🔴 **Critical** — Immediate action required
- ⚫ **Offline** — No recent telemetry

---

## ⌨️ Keyboard Navigation

### Tab Order
1. Navbar buttons
2. Asset list (Fleet Status)
3. Timeline events
4. Bottom action buttons

### Arrow Keys
- Navigate command palette options
- Scroll timeline with Up/Down
- Move between tabs

### Enter
- Execute command from palette
- Activate focused button
- Submit input fields

---

## 🎨 Design Theme

### Colors
| Element | Color | Hex |
|---------|-------|-----|
| Background | Near Black | `#0C0C0E` |
| Text | Light Gray | `#E4E4E4` |
| Primary (Buttons) | Amber | `#F5A623` |
| Secondary | Blue | `#2E9AFF` |
| Success | Green | `#5FFF96` |
| Error | Red | `#FF4040` |
| Borders | Dark Gray | `#2E2E34` |

### Typography
- **Headings**: Bold, uppercase, 0.1em letter-spacing
- **Body**: Regular, 14px font-size
- **Mono**: Code/coordinates in monospace

---

## 🚀 Tips & Tricks

### Pro Tips
1. **Fast Navigation**: Use command palette (`/`) instead of clicking nav
2. **Multi-Task**: Open FlowIQ assistant while viewing timeline
3. **Quick Site Switch**: Click inset map to toggle sites instantly
4. **Mission Reuse**: Copy mission templates before execution
5. **Timeline Replay**: Scroll back through events to understand sequence

### Troubleshooting
- **Command Palette Not Opening?** Make sure no text input is focused
- **Alerts Not Showing?** Check browser notifications permissions
- **Mission Won't Execute?** Ensure at least 1 step is added
- **FlowIQ Unresponsive?** Close and reopen assistant panel

---

## 📱 Responsive Behavior

### Desktop (1920x1080+)
- Full 3-column layout with sidebar
- Timeline shows 5+ events at once
- Mission builder side-by-side columns

### Laptop (1366x768)
- Compact layout with scrollable regions
- Timeline scrolls more frequently
- Sidebar collapses on smaller widths

### Tablet/Mobile
- Single-column stacked layout
- Fullscreen overlays for modals
- Touch-friendly buttons (56px minimum)

---

## 🔐 Future Features (Roadmap)

### Coming Soon
- ✨ WebSocket real-time telemetry streaming
- 🗺️ Deck.GL GPU-powered mapping with terrain
- 📈 Historical analytics with D3 charts
- 💾 Mission persistence and versioning
- 🔑 User authentication and role-based access

### Experimental
- 🤖 Autonomous anomaly response
- 📡 MQTT sensor integration
- 🎮 VR mission visualization
- 🧠 ML-powered predictive maintenance

---

## 📞 Support

For issues or feature requests, refer to `IMPLEMENTATION_ROADMAP.md` in the project root.

**Last Updated**: 2024
**Version**: 2.0 (MVP2)
