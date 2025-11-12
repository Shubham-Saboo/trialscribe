# Valid React Icons Reference for TrialScribe

Based on react-icons v5.5.0 and FontAwesome 5, here are confirmed valid icons you can use:

## Currently Working Icons in Codebase

### Navigation & Arrows
- `FaChevronDown` - Down chevron
- `FaChevronUp` - Up chevron
- `FaArrowRight` - Right arrow (basic)
- `FaExternalLinkAlt` - External link

### Files & Documents
- `FaFileAlt` - File/document icon
- `FaDownload` - Download icon
- `FaPaperPlane` - Send/submit icon

### User & People
- `FaUser` - Single user
- `FaRobot` - Robot/AI icon
- `FaBirthdayCake` - Birthday/age
- `FaVenusMars` - Gender icon

### Medical & Health
- `FaFlask` - Laboratory/test icon
- `FaPills` - Medications
- `FaNotesMedical` - Medical notes
- `FaStethoscope` - Medical/healthcare
- `FaExclamationTriangle` - Warning/alert
- `FaExclamationCircle` - Info alert

### Search & Filter
- `FaSearch` - Search icon
- `FaFilter` - Filter icon
- `FaInbox` - Inbox/empty state

### Status & Actions
- `FaCheckCircle` - Success/check
- `FaTimesCircle` - Error/close
- `FaClock` - Time/clock
- `FaStar` - Star/favorite
- `FaInfoCircle` - Information

### Data & Charts
- `FaChartPie` - Pie chart
- `FaChartLine` - Line chart
- `FaChartBar` - Bar chart
- `FaChartArea` - Area chart
- `FaHdd` - Hard drive/storage

### Cloud & Upload
- `FaCloud` - Cloud icon
- `FaCloudUploadAlt` - Cloud upload (if available)
- `FaUpload` - Upload icon

### Security & Protection
- `FaShieldVirus` - Shield with virus (security)
- `FaShieldAlt` - Shield alternative
- `FaLock` - Lock icon
- `FaLockOpen` - Unlock icon

### Target & Precision
- `FaCrosshairs` - Crosshairs/target
- `FaBullseye` - Bullseye target

### Other Useful Icons
- `FaGlobe` - Globe/world/location
- `FaHistory` - History icon
- `FaList` - List icon
- `FaTimes` - Close/X icon
- `FaPlay` - Play button
- `FaStop` - Stop button

## Icon Replacement Guide

If an icon doesn't exist, use these alternatives:

| Original (Doesn't Exist) | Replacement (Valid) |
|-------------------------|---------------------|
| `FaLongArrowAltRight` | `FaArrowRight` |
| `FaCloudUploadAlt` | `FaCloud` |
| `FaDatabase` | `FaHdd` |
| `FaChartArea` | `FaChartPie` or `FaChartLine` |
| `FaBullseye` | `FaCrosshairs` |
| `FaShieldAlt` | `FaShieldVirus` |
| `FaUsers` | `FaUser` (singular) |
| `FaMagic` | `FaStar` |
| `FaBrain` | `FaStar` or `FaRobot` |
| `FaRocket` | `FaStar` |

## How to Find More Icons

1. Visit [React Icons Website](https://react-icons.github.io/react-icons/)
2. Click on "Font Awesome 5" section
3. Browse or search for icons
4. Use the exact name shown (e.g., `FaBeer` becomes `import { FaBeer } from 'react-icons/fa'`)

## Best Practices

1. **Always test imports** - If TypeScript shows an error, the icon doesn't exist
2. **Use working icons as reference** - Check what's already working in your codebase
3. **Keep it simple** - Prefer common, well-known icons over obscure ones
4. **Consistent style** - Stick to FontAwesome 5 (`react-icons/fa`) for consistency

## Common Icon Categories

### For Actions
- `FaPlay`, `FaStop`, `FaPause`
- `FaSave`, `FaEdit`, `FaTrash`
- `FaPlus`, `FaMinus`, `FaTimes`

### For Status
- `FaCheckCircle` (success)
- `FaTimesCircle` (error)
- `FaExclamationCircle` (warning)
- `FaInfoCircle` (info)

### For Navigation
- `FaChevronLeft`, `FaChevronRight`
- `FaChevronUp`, `FaChevronDown`
- `FaArrowLeft`, `FaArrowRight`
- `FaArrowUp`, `FaArrowDown`

### For Data
- `FaChartPie`, `FaChartBar`, `FaChartLine`
- `FaTable`, `FaList`, `FaTh`

