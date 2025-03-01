const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware to handle CORS
app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS) if needed
app.use(express.static('public'));

// Endpoint to create the HTML file
app.post('/create-file', (req, res) => {
    const { filename, content, type } = req.body;

    if (!filename || !content || !type) {
        return res.status(400).send('Invalid input');
    }

    // Define the directory where the file should be saved based on the type
    const folderPath = path.join(__dirname, 'builderComponents', type);

    // Check if the directory exists, and if not, create it
    if (!fs.existsSync(folderPath)) {
        // Create the directory recursively (supports nested folders)
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // Define the file path
    let filePath = path.join(folderPath, `${filename}.html`);

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
        // Get current date and time to append to the filename
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;
        
        // Rename the file by appending the date
        const newFilename = `${filename}_${formattedDate}.html`;
        filePath = path.join(folderPath, newFilename);
    }

    // Write the content to the file
    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error writing file');
        }
        res.status(200).json({ message: 'File created successfully' });

    });
});

// Endpoint to get all component files
app.get('/component-files', (req, res) => {
    const componentsDir = path.join(__dirname, 'builderComponents');
    let componentFiles = [];

    // Read all folders inside 'builderComponents'
    fs.readdir(componentsDir, (err, folders) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading directory');
        }

        // Use a counter to track when all directories are processed
        let pendingFolders = folders.length;

        if (pendingFolders === 0) {
            return res.json(componentFiles);  // No folders found, send empty response
        }

        // Iterate over each folder (which represents a type)
        folders.forEach((folder) => {
            const folderPath = path.join(componentsDir, folder);

            // Check if it's a directory (type folder)
            if (fs.statSync(folderPath).isDirectory()) {
                // Read all HTML files in this folder
                fs.readdir(folderPath, (err, files) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error reading directory');
                    }

                    // Add each file to the componentFiles array with the correct type
                    files.forEach((file) => {
                        if (file.endsWith('.html')) {
                            componentFiles.push({
                                type: folder,
                                path: file
                            });
                        }
                    });

                    // Decrement the counter, and when all folders are processed, send the response
                    pendingFolders--;

                    // Only send the response when all folders are processed
                    if (pendingFolders === 0) {
                        res.json(componentFiles);  // Send the response only once, after all folders
                    }
                });
            } else {
                // If it's not a directory, decrement the counter
                pendingFolders--;
                if (pendingFolders === 0) {
                    res.json(componentFiles);  // Send the response if all folders are processed
                }
            }
        });
    });
});

// Fetch HTML content for a specific component file
app.get('/component/:type/:filename', (req, res) => {
    const { type, filename } = req.params;

    // Define the path to the file based on the type (folder) and filename
    const filePath = path.join(__dirname, 'builderComponents', type, filename);

    // Check if the file exists and read its content
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(404).send('Component not found');
        }

        // Send the HTML content back to the frontend
        res.send(data);
    });
});

app.get('/component-types', (req, res) => {
    const componentsDir = path.join(__dirname, 'builderComponents'); // Adjust path as needed

    // Read the directory to get the names of the folders
    fs.readdir(componentsDir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(500).send('Error reading component types');
        }

        // Filter out only directories
        const componentTypes = files
            .filter(file => file.isDirectory())
            .map(file => file.name);

        // Send the array of component types back to the client
        res.json(componentTypes);
    });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
