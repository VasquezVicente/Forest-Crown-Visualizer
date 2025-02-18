
import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Image as ImageLayer, Vector as VectorLayer } from 'ol/layer';
import { ImageStatic as Static, Vector as VectorSource } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Stroke, Fill } from 'ol/style';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';


proj4.defs('EPSG:32617', '+proj=utm +zone=17 +datum=WGS84 +units=m +no_defs');
register(proj4);

const CombinedGeospatialViewer = ({ date }) => {
    const mapRef = useRef();
    const mapInstance = useRef(null);
    const [imageMeta, setImageMeta] = useState(null);
    const [crownsData, setCrownsData] = useState(null);
    const [imageLayer, setImageLayer] = useState(null);
    const [imageExtent, setImageExtent] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [leafingValue, setLeafingValue] = useState(0);
    const [floweringStatus, setFloweringStatus] = useState('');
    const [floweringValue, setFloweringValue] = useState(0);
    const [segmentationValue, setSegmentationValue] = useState('');
    const [submittedFeatures, setSubmittedFeatures] = useState(new Set()); // Add this to track submitted features
    const [vectorLayer, setVectorLayer] = useState(null);
    const [message, setMessage] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [imageRes, crownsRes] = await Promise.all([
                    fetch(`${apiUrl}/image?date=${date}`),
                    fetch(`${apiUrl}/crowns?date=${date}`)
                ]);

                if (!imageRes.ok || !crownsRes.ok) throw new Error('Data fetch failed');

                const [imageJson, crownsJson] = await Promise.all([
                    imageRes.json(),
                    crownsRes.json()
                ]);



                setImageMeta(imageJson);
                setCrownsData(crownsJson);

                const band = imageJson.bands[0];
                const crsTransform = band.crs_transform;
                const [width, height] = band.dimensions;

                const minX = crsTransform[2];
                const maxY = crsTransform[5];
                const pixelWidth = crsTransform[0];
                const pixelHeight = crsTransform[4];
                const imageExtent = [
                    minX,
                    maxY + (height * pixelHeight),
                    minX + (width * pixelWidth),
                    maxY
                ];

                const imageLayer = new ImageLayer({
                    source: new Static({
                        url: `${apiUrl}/render-image?date=${date}`,
                        imageExtent,
                        projection: 'EPSG:32617'
                    })
                });

                setImageLayer(imageLayer);
                setImageExtent(imageExtent);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [date]);

    useEffect(() => {
        if (!mapRef.current || !imageMeta || !crownsData) return;

        const vectorSource = new VectorSource({
            features: new GeoJSON().readFeatures(crownsData, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:32617'
            })
        });

        const vector = new VectorLayer({
            source: vectorSource,
            style: feature => {
                const featureId = `${feature.get('GlobalID')}+${feature.get('date')}`;
                let color = (feature.get('style')?.color || '#FF0000'); // Default red color

                if (submittedFeatures.has(featureId)) {
                    color = '#0000FF';
                }

                if (selectedFeature &&
                    feature.get('GlobalID') === selectedFeature.globalID &&
                    feature.get('date') === selectedFeature.date) {
                    color = '#FFFF00';
                }

                return new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2
                    }),
                    fill: new Fill({
                        color: 'rgba(0,0,0,0)'
                    })
                });
            }
        });

        setVectorLayer(vector);

        if (!mapInstance.current) {
            const map = new Map({
                target: mapRef.current,
                layers: [imageLayer, vector],
                view: new View({
                    projection: 'EPSG:32617',
                    center: [(imageExtent[0] + imageExtent[2])/2, (imageExtent[1] + imageExtent[3])/2],
                    zoom: 14,
                    maxZoom: 20
                })
            });

            // Initial fit to extent (only done once)
            map.getView().fit(imageExtent, { padding: [50, 50, 50, 50] });

            mapInstance.current = map;
        } else {
            // Update layers without creating new map
            mapInstance.current.setLayers([imageLayer, vector]);
        }

        const clickHandler = event => {
            const feature = mapInstance.current.getFeaturesAtPixel(event.pixel)[0];
            setSelectedFeature(feature ? {
                globalID: feature.get('GlobalID'),
                latinName: feature.get('latin'),
                date: feature.get('date')
            } : null);

            // Force vector layer to refresh its style when selection changes
            if (vector && !selectedFeature) {
                vectorLayer?.getSource()?.refresh();
            }
        };

        mapInstance.current.on('click', clickHandler);
        return () => {
            if (mapInstance.current) {
                mapInstance.current.un('click', clickHandler);
            }
        };
    }, [imageMeta, crownsData, date, submittedFeatures, selectedFeature]);

    useEffect(() => {
        setLeafingValue(0);
        setFloweringStatus(null);
        setFloweringValue(0);
        setSegmentationValue('');
        setMessage('');
    }, [selectedFeature]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFeature || leafingValue === null) { // Add null check here
            setMessage('Please enter the leafing value');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/observations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    globalId: selectedFeature.globalID,
                    latinName: selectedFeature.latinName,
                    date: selectedFeature.date,
                    leafing: leafingValue,
                    isFlowering: floweringStatus,
                    floweringIntensity: floweringValue,
                    segmentation: segmentationValue
                })
            });

            if (response.ok) {
                setMessage('Observation submitted successfully!');
                // Add the feature ID to submittedFeatures
                setSubmittedFeatures(prev => new Set([...prev, `${selectedFeature.globalID}+${selectedFeature.date}`]));

                // Force vector layer to refresh its style
                if (vectorLayer) {
                    vectorLayer.getSource().refresh();
                }

                setSelectedFeature(null);
            } else {
                setMessage('Error submitting observation');
            }
        } catch {
            setMessage('Network error - please try again');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const detailsPanel = selectedFeature && (
        <div style={{
            height: '100%',
            overflowY: 'auto',
            backgroundColor: 'white',
            padding: '1.5rem',
            borderLeft: '1px solid #e5e7eb'
        }}>
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem'
            }}>Feature Details</h3>

            <div style={{ marginBottom: '1rem' }}>
                <table style={{ width: '100%' }}>
                    <tbody>
                    <tr>
                        <td style={{ padding: '0.25rem 0' }}><strong>Global ID:</strong></td>
                        <td>{selectedFeature.globalID}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '0.25rem 0' }}><strong>Latin Name:</strong></td>
                        <td>{selectedFeature.latinName}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '0.25rem 0' }}><strong>Date:</strong></td>
                        <td>{selectedFeature.date}</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Leafing Amount (0-10):
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={leafingValue}
                            onChange={(e) => setLeafingValue(parseInt(e.target.value))}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                            required
                        />
                        <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
                            {leafingValue === 0 ? 'None' : leafingValue}
                        </div>
                    </label>
                </div>

                <fieldset style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    padding: '1rem',
                    margin: '0'
                }}>
                    <legend style={{ padding: '0 0.5rem', fontSize: '0.875rem' }}>
                        Is Flowering? (Required)
                    </legend>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <input
                                type="radio"
                                name="flowering"
                                value="yes"
                                checked={floweringStatus === 'yes'}
                                onChange={(e) => {
                                    setFloweringStatus(e.target.value);
                                    setFloweringValue(1);
                                }}
                                required
                                style={{ marginRight: '0.5rem' }}
                            />
                            Yes
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <input
                                type="radio"
                                name="flowering"
                                value="no"
                                checked={floweringStatus === 'no'}
                                onChange={(e) => {
                                    setFloweringStatus(e.target.value);
                                    setFloweringValue(0);
                                }}
                                style={{ marginRight: '0.5rem' }}
                            />
                            No
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <input
                                type="radio"
                                name="flowering"
                                value="maybe"
                                checked={floweringStatus === 'maybe'}
                                onChange={(e) => {
                                    setFloweringStatus(e.target.value);
                                    setFloweringValue(2);
                                }}
                                style={{ marginRight: '0.5rem' }}
                            />
                            Maybe
                        </label>
                    </div>
                </fieldset>

                {floweringStatus === 'yes' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Flowering Intensity (1-100):
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={floweringValue}
                                onChange={(e) => setFloweringValue(parseInt(e.target.value))}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                required
                            />
                            <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
                                {floweringValue}
                            </div>
                        </label>
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                        Segmentation Quality:
                        <select
                            value={segmentationValue}
                            onChange={(e) => setSegmentationValue(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                marginTop: '0.5rem'
                            }}
                            required
                        >
                            <option value="" disabled>Select one</option>
                            <option value="good">Good</option>
                            <option value="okay">Okay</option>
                            <option value="bad">Bad</option>
                        </select>
                    </label>
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '1rem'
                    }}
                >
                    Submit Observation
                </button>
            </form>

            {message && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.5rem',
                    textAlign: 'center',
                    borderRadius: '4px',
                    backgroundColor: message.includes('success') ? '#f0fdf4' : '#fef2f2',
                    color: message.includes('success') ? '#166534' : '#dc2626'
                }}>
                    {message}
                </div>
            )}
        </div>
    );

    if (loading) return <div className="loading">Loading data...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div style={{
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            height: '100vh',
            border: '2px solid #e5e7eb', // Main container border
            borderRadius: '8px',
            boxSizing: 'border-box',
            overflow: 'hidden' // Contain child borders
        }}>
            <div style={{
                flex: 1,
                width: selectedFeature && window.innerWidth >= 768 ? '66.666667%' : '100%',
                borderRight: window.innerWidth >= 768 ? '2px solid #e5e7eb' : 'none', // Responsive right border
                boxSizing: 'border-box'
            }}>
                <div ref={mapRef} style={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid #d1d5db', // Map container border
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                }} />
            </div>
            {selectedFeature && (
                <div style={{
                    width: window.innerWidth >= 768 ? '33.333333%' : '100%',
                    maxWidth: '32rem',
                    borderLeft: window.innerWidth >= 768 ? '2px solid #e5e7eb' : 'none', // Responsive left border
                    borderTop: window.innerWidth < 768 ? '2px solid #e5e7eb' : 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                }}>
                    {detailsPanel}
                </div>
            )}
        </div>
    );
};

export default CombinedGeospatialViewer;