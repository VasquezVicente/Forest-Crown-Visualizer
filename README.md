# Forest Crown Visualizer 🌳🛰️

A geospatial visualization tool for analyzing forest crown phenology data across multiple dates. This React application integrates with OpenLayers for map visualization and provides an interactive interface for ecological observations.

## Features ✨

- **Temporal Analysis**: View forest crown data across 100+ dates from 2018-2024
- **Interactive Map**:
    - UTM projection support (EPSG:32617)
    - Dynamic feature selection
    - Multi-layer visualization (imagery + vector data)
- **Phenology Tracking**:
    - Leafing amount (0-10 scale)
    - Flowering status and intensity
    - Crown segmentation quality assessment
- **Data Submission**: Secure API integration for observation storage
- **Responsive Design**: Adaptive layout for desktop and mobile viewports

## Tech Stack 💻

- **Frontend**: React 18 + Vite
- **Mapping**: OpenLayers 10
- **Projection**: Proj4
- **Routing**: React Router 7
- **Linting**: ESLint with React plugins
- **Deployment**: GitHub Pages


## Installation ⚙️
```angular2html
1. Clone the repository:
git clone https://github.com/VasquezVicente/Forest-Crown-Visualizer.git
cd Forest-Crown-Visualizer


2. Install dependencies:
npm install


3. Set up environment variables:
cp .env-example .env
Update VITE_API_URL with your backend endpoint

4. Start development server:
npm run dev

```

## Usage 🗓️

1. **Date Selection**:
    - Choose from 100+ available dates in the dropdown
    - Temporal range: 2018-04-04 to 2024-03-18

2. **Map Interaction**:
    - Click crowns to view details
    - Zoom with mouse wheel
    - Dynamic layer styling based on submission status

3. **Observation Submission**:
    - Complete the phenology form for selected crowns
    - Track submission status through color changes
    - Real-time feedback with success/error messages

## API Integration 🔗

The application requires a backend API supporting these endpoints:

| Endpoint          | Method | Parameters       | Description                     |
|--------------------|--------|------------------|---------------------------------|
| `/api/image`       | GET    | `date`           | Get image metadata              |
| `/api/crowns`      | GET    | `date`           | Get crown geojson data          |
| `/api/observations`| POST   | JSON payload     | Submit phenology observations   |

Configure your API endpoint in `.env`:
```angular2html
VITE_API_URL=<your-backend-url>
```
## Contributing 🤝

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch :