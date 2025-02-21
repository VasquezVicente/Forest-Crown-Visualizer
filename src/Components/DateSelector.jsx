import { useState } from 'react';
import CombinedGeospatialViewer from "./CombinedGeospatialViewer.jsx";

const DateSelector = () => {
    const dates = [
        '2018-04-04', '2018-04-25', '2018-05-23', '2018-07-24',
        '2018-08-27', '2018-10-26', '2018-11-26', '2018-12-26',
        '2019-01-28', '2019-02-25', '2019-03-25', '2019-04-24',
        '2019-05-31', '2019-06-27', '2019-07-24', '2019-08-28',
        '2019-09-23', '2019-10-17', '2019-11-28', '2019-12-26',
        '2020-01-24', '2020-02-27', '2020-05-27', '2020-06-15',
        '2020-08-01', '2020-09-21', '2020-10-26', '2020-11-25',
        '2020-12-22', '2021-01-27', '2021-02-25', '2021-03-25',
        '2021-04-29', '2021-05-26', '2021-07-02', '2021-07-28',
        '2021-08-25', '2021-09-29', '2021-10-27', '2021-11-24',
        '2021-12-28', '2022-01-26', '2022-02-24', '2022-03-30',
        '2022-04-27', '2022-05-25', '2022-06-29', '2022-07-27',
        '2022-08-24', '2022-09-29', '2022-10-27', '2022-11-24',
        '2022-12-28', '2023-01-30', '2023-02-07', '2023-02-14',
        '2023-02-22', '2023-02-28', '2023-03-07', '2023-03-14',
        '2023-03-21', '2023-03-28', '2023-04-04', '2023-04-11',
        '2023-04-18', '2023-04-25', '2023-05-02', '2023-05-09',
        '2023-05-16', '2023-05-23', '2023-05-30', '2023-06-06',
        '2023-06-13', '2023-06-21', '2023-06-27', '2023-07-05',
        '2023-07-11', '2023-07-19', '2023-07-26', '2023-08-01',
        '2023-08-08', '2023-08-15', '2023-09-05', '2023-09-12',
        '2023-09-19', '2023-09-26', '2023-10-03', '2023-10-11',
        '2023-10-17', '2023-10-24', '2023-10-31', '2023-11-14',
        '2023-11-27', '2023-12-05', '2023-12-12', '2024-01-03',
        '2024-01-09', '2024-01-17', '2024-01-25', '2024-02-01',
        '2024-02-08', '2024-02-15', '2024-02-21', '2024-02-28',
        '2024-03-06', '2024-03-18'
    ];

    // Randomly select an initial date
    const [selectedDate, setSelectedDate] = useState(dates[Math.floor(Math.random() * dates.length)]);
    //const [selectedDate, setSelectedDate] = useState(dates[0] ?? '');

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{textAlign:"center"}}>Forest Crown Visualization</h1>
            <div style={{ marginBottom: '20px', textAlign:"center" }}>
                <label htmlFor="date-select" style={{ marginRight: '10px' }}>
                    Select Date:
                </label>
                <select
                    id="date-select"
                    value={selectedDate}
                    onChange={handleDateChange}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        minWidth: '200px',
                        textAlign : "center"
                    }}
                >
                    {dates.map(date => (
                        <option key={date} value={date}>
                            {date}
                        </option>
                    ))}
                </select>
            </div>
            <CombinedGeospatialViewer date={selectedDate} maxSize={3930}/>
        </div>
    );
};

export default DateSelector;
