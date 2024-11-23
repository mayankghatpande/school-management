const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const haversine = require('haversine-distance');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// MySQL Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'school_management'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
        return;
    }
    console.log('Connected to the database.');

    // Create the schools table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS schools (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255) NOT NULL,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL
        );
    `;
    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Failed to create schools table:', err.message);
            return;
        }
        console.log('Schools table is ready.');
    });
});

// Add School API
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validate input
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const insertQuery = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error('Error inserting school:', err.message);
            return res.status(500).json({ error: 'Failed to add school.' });
        }
        res.json({ message: 'School added successfully.', schoolId: result.insertId });
    });
});

// List Schools API
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    // Validate input
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const selectQuery = 'SELECT * FROM schools';
    db.query(selectQuery, (err, results) => {
        if (err) {
            console.error('Error fetching schools:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve schools.' });
        }

        const userLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };

        // Calculate distance and sort schools
        const sortedSchools = results.map((school) => {
            const schoolLocation = { latitude: school.latitude, longitude: school.longitude };
            const distance = haversine(userLocation, schoolLocation);
            return { ...school, distance };
        }).sort((a, b) => a.distance - b.distance);

        res.json(sortedSchools);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
