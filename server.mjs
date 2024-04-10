import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import mongoose from 'mongoose';

// Import your Mongoose model for the data you want to store
import { Course } from './models/course.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// Define storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Set upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use original filename
  }
});

// Initialize multer with defined storage
const upload = multer({ storage: storage });

// Handle file upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Read the uploaded file with multer
    const workbook = xlsx.readFile(req.file.path);

    // Convert first sheet of workbook to JSON
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    // Transform JSON data to match Mongoose schema
    const transformedData = jsonData.map(item => ({
      COURSE_NUMBER: item['COURSE #'],
      TITLE_START_DATE: item['TITLE/START DATE'],
      ACADEMIC_LEVEL: item['Acad Level'],
      CAPACITY: item['CAPACITY'],
      NUMBER_OF_STUDENTS: item['# OF STUDENTS'],
      STATUS: item['STATUS'],
      INSTRUCTOR: item['INSTRUCTOR'],
      START_TIME: item['Start Time'],
      END_TIME: item['End Time'],
      MEETING_DAYS: item['Meeting Days'],
      BUILDING: item['Bldg'],
      ROOM: item['Room'],
      FEE: item['FEE'],
      MIN_CREDITS: item['Min Cred'],
      MAX_CREDITS: item['Max Cred'],
      SECTION: item['Section'],
      TERM: item['Term'],
      SEQ_NO: item['Seq No'],
      SCHOOLS: item['Schools'],
      ACADEMIC_LEVEL_1: item['Acad Level_1']
    }));

    // Import JSON data into MongoDB
    await Course.insertMany(transformedData);

    // Delete the XLSX file
    fs.unlinkSync(req.file.path);

    console.log('XLSX file deleted successfully');

    // Respond with success message
    return res.status(200).json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while uploading file' });
  }
});


// // Handle file upload endpoint
// app.post('/api/upload', upload.single('file'), async (req, res) => {
//   try {
//     // Check if file was uploaded
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'No file uploaded' });
//     }

//     // Read the uploaded file with multer
//     const workbook = xlsx.readFile(req.file.path);

//     // Convert first sheet of workbook to JSON
//     const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

//     // Get the original filename without extension
//     const originalFileName = path.parse(req.file.originalname).name;

//     // Save JSON data to a file
//     const jsonFilePath = path.join(__dirname, 'uploads', originalFileName + '.json');
//     fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

//     console.log('JSON file saved successfully:', jsonFilePath);

//     // Import JSON data into MongoDB
//     await Course.insertMany(jsonData);

//     // Delete the XLSX file
//     fs.unlinkSync(req.file.path);

//     console.log('XLSX file deleted successfully');

//     // Respond with success message
//     return res.status(200).json({ success: true, message: 'File uploaded successfully', jsonFilePath });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     return res.status(500).json({ success: false, message: 'An error occurred while uploading file' });
//   }
// });




// Retrieve all data
app.get('/api/data', (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename parameter is required' });
    }
    const jsonFilePath = path.join(__dirname, 'uploads', `${filename}.json`);
    const jsonData = fs.readFileSync(jsonFilePath);
    const data = JSON.parse(jsonData);
    res.json(data);
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ success: false, message: 'An error occurred while retrieving data' });
  }
});

// Retrieve data by ID
app.get('/api/data/:id', (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename parameter is required' });
    }
    const jsonFilePath = path.join(__dirname, 'uploads', `${filename}.json`);
    const jsonData = fs.readFileSync(jsonFilePath);
    const data = JSON.parse(jsonData);
    const id = req.params.id;
    const item = data.find(item => item.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ success: false, message: 'An error occurred while retrieving data' });
  }
});

// Update data by ID
app.put('/api/data/:id', (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename parameter is required' });
    }
    const jsonFilePath = path.join(__dirname, 'uploads', `${filename}.json`);
    const jsonData = fs.readFileSync(jsonFilePath);
    let data = JSON.parse(jsonData);
    const id = req.params.id;
    const newData = req.body;
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    data[index] = { ...data[index], ...newData };
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating data' });
  }
});

// Delete data by ID
app.delete('/api/data/:id', (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename parameter is required' });
    }
    const jsonFilePath = path.join(__dirname, 'uploads', `${filename}.json`);
    const jsonData = fs.readFileSync(jsonFilePath);
    let data = JSON.parse(jsonData);
    const id = req.params.id;
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    data.splice(index, 1);
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting data' });
  }
});




const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/coursesDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => console.log('Connected to MongoDB'));






// previous code
// import express from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// import cors from 'cors';
// import multer from 'multer';
// import xlsx from 'xlsx';
// import fs from 'fs';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const app = express();

// app.use(express.static(path.join(__dirname, 'public')));
// app.use(cors());
// app.use(express.json());

// // Define storage for multer
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/') // Set upload directory
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname) // Use original filename
//   }
// });

// // Initialize multer with defined storage
// const upload = multer({ storage: storage });

// // Handle file upload endpoint
// app.post('/api/upload', upload.single('file'), async (req, res) => {
//   try {
//     // Check if file was uploaded
//     if (!req.file) {
//       return res.status(400).json({ success: false, message: 'No file uploaded' });
//     }

//     const originalFileName = req.file.originalname;
//     const jsonFileName = path.parse(originalFileName).name + '.json';

//     // Read the uploaded file with multer
//     const workbook = xlsx.readFile(req.file.path);

//     // Convert first sheet of workbook to JSON
//     const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

//     // Save JSON data to a file with the original file name
//     const jsonFilePath = path.join(__dirname, 'uploads', jsonFileName);
//     fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));

//     console.log('JSON file saved successfully:', jsonFilePath);

//     // Respond with success message
//     return res.status(200).json({ success: true, message: 'File uploaded successfully', jsonFilePath });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     return res.status(500).json({ success: false, message: 'An error occurred while uploading file' });
//   }
// });


// // CRUD Routes

// // Retrieve all data
// app.get('/api/data', (req, res) => {
//   try {
//     const originalFileName = req.query.filename;
//     const jsonFilePath = path.join(__dirname, 'uploads', originalFileName + '.json');
//     const jsonData = fs.readFileSync(jsonFilePath);
//     const data = JSON.parse(jsonData);
//     res.json(data);
//   } catch (error) {
//     console.error('Error retrieving data:', error);
//     res.status(500).json({ success: false, message: 'An error occurred while retrieving data' });
//   }
// });

// // Retrieve data by ID
// app.get('/api/data/:id', (req, res) => {
//   try {
//     const originalFileName = req.query.filename;
//     const jsonFilePath = path.join(__dirname, 'uploads', originalFileName + '.json');
//     const jsonData = fs.readFileSync(jsonFilePath);
//     const data = JSON.parse(jsonData);
//     const id = req.params.id;
//     const item = data.find(item => item.id === id);
//     if (!item) {
//       return res.status(404).json({ success: false, message: 'Data not found' });
//     }
//     res.json(item);
//   } catch (error) {
//     console.error('Error retrieving data:', error);
//     res.status(500).json({ success: false, message: 'An error occurred while retrieving data' });
//   }
// });

// // Update data by ID
// app.put('/api/data/:id', (req, res) => {
//   try {
//     const originalFileName = req.query.filename;
//     const jsonFilePath = path.join(__dirname, 'uploads', originalFileName + '.json');
//     const jsonData = fs.readFileSync(jsonFilePath);
//     let data = JSON.parse(jsonData);
//     const id = req.params.id;
//     const newData = req.body;
//     const index = data.findIndex(item => item.id === id);
//     if (index === -1) {
//       return res.status(404).json({ success: false, message: 'Data not found' });
//     }
//     data[index] = { ...data[index], ...newData };
//     fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
//     res.json({ success: true, message: 'Data updated successfully' });
//   } catch (error) {
//     console.error('Error updating data:', error);
//     res.status(500).json({ success: false, message: 'An error occurred while updating data' });
//   }
// });

// // Delete data by ID
// app.delete('/api/data/:id', (req, res) => {
//   try {
//     const originalFileName = req.query.filename;
//     const jsonFilePath = path.join(__dirname, 'uploads', originalFileName + '.json');
//     const jsonData = fs.readFileSync(jsonFilePath);
//     let data = JSON.parse(jsonData);
//     const id = req.params.id;
//     const index = data.findIndex(item => item.id === id);
//     if (index === -1) {
//       return res.status(404).json({ success: false, message: 'Data not found' });
//     }
//     data.splice(index, 1);
//     fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
//     res.json({ success: true, message: 'Data deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting data:', error);
//     res.status(500).json({ success: false, message: 'An error occurred while deleting data' });
//   }
// });


// const PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });











// import express from "express"
// import cors from "cors"
// import mongoose from "mongoose"
// import User from "./models/user.js"
// // import 'dotenv/config'
// // import connection from './config/dbConnection.js'

// const app = express()

// app.use(cors())
// app.use(express.json())
// app.use(express.urlencoded({extended: false}))

// app.use(express.static('public'))

// //routes

// app.get('/', (req, res) => {
//     res.send('Hello Dave, NoSQL/RESTful API class')   
// })

// app.get('/blog', (req, res) => {
//     res.send('Hello Blog, My name is Node-API')
// })

// app.get('/api/users', async(req, res) => {
//     try {
//         const users = await User.find({});
//         //res.status(200).json(`<pre>${JSON.stringify(users, null, 2)}</pre>`);
//         //let htmlResponse = '<ul>';
//         //users.forEach(user => {
//         //    htmlResponse += `<li>${JSON.stringify(user)}</li>`;
//         //});
//         //htmlResponse += '</ul>';
//         res.status(200).json(users);
//     } catch (error) {
//         res.status(500).json({message: error.message})
//     }
// })

// app.get('/api/users/:id', async(req, res) =>{
//     try {
//         const {id} = req.params;
//         const user = await User.findById(id);
//         //res.status(200).json(user);
//         let htmlResponse = '<ul>';
//         htmlResponse += `<li>${JSON.stringify(user)}</li>`;
//         htmlResponse += '</ul>';
//         res.status(200).send(htmlResponse);
//     } catch (error) {
//         res.status(500).json({message: error.message})
//     }
// })


// app.post('/api/users', async(req, res) => {
//     try {
//         const user = await User.create(req.body)
//         res.status(200).json(user);
        
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({message: error.message})
//     }
// })

// // update a product
// app.put('/api/users/:id', async(req, res) => {
//     try {
//         const {id} = req.params;
//         const user = await User.findByIdAndUpdate(id, req.body, { new: true });
//         // we cannot find any product in database
//         if(!user){
//             return res.status(404).json({message: `cannot find any user with ID ${id}`})
//         }
//         const updatedUser = await User.findById(id);
//         res.status(200).json(updatedUser);
        
//     } catch (error) {
//         res.status(500).json({message: error.message})
//     }
// })

// // delete a product

// app.delete('/api/delete/:id', async(req, res) =>{
//     try {
//         const {id} = req.params;
//         const user = await User.findByIdAndDelete(id);
//         if(!user){
//             return res.status(404).json({message: `cannot find any user with ID ${id}`})
//         }
//         res.status(200).json(user);
        
//     } catch (error) {
//         res.status(500).json({message: error.message})
//     }
// })

// mongoose.set("strictQuery", false)
// mongoose.
// //connect('mongodb://localhost:27017/usersDB?authSource=admin')
// connect('mongodb://127.0.0.1:27017/usersDB?authSource=admin')
// .then(() => {
//     console.log('connected to MongoDB')
//     app.listen(3001, ()=> {
//         console.log(`Node API app is running on port 3001`)
//     });
// }).catch((error) => {
//     console.log(error)
// })