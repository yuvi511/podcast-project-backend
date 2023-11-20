const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5001;

app.use(bodyParser.json());
app.use(cors());


mongoose.connect('mongodb://localhost:27017/podcastDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  uploadedPodcasts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Podcast' }],
});

const User = mongoose.model('User', userSchema);


const podcastSchema = new mongoose.Schema({
  title: String,
  description: String,
  audioFile: String,
});

const Podcast = mongoose.model('Podcast', podcastSchema);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


app.post('/upload', upload.single('audioFile'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      res.status(400).json({ error: 'Audio file is required' });
      return;
    }

    const newPodcast = new Podcast({ title, description, audioFile: audioFile.filename });
    await newPodcast.save();

    res.status(201).json({ message: 'Podcast uploaded successfully' });
  } catch (error) {
    console.error('Error uploading podcast:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/podcasts', async (req, res) => {
  try {
    const podcasts = await Podcast.find({});
    res.status(200).json(podcasts);
  } catch (error) {
    console.error('Error getting podcasts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    
    const user = await User.findOne({ username, password });

    if (user) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      
      const newUser = new User({ username, password });
      await newUser.save();
      res.status(201).json({ message: 'Registration successful' });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
