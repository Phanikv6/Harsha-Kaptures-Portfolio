/**
 * Seed initial projects from existing data. Run: node seed.js
 * Requires: MongoDB running, MONGODB_URI in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Setting = require('./models/Setting');

const config = require('./config');

const defaultProjects = [
  { title: 'Ganapathi Bappa Morya', description: 'An enchanting gallery of Lord Ganesha, capturing whispers of devotion in every shade and silhouette.', coverImage: 'images/ganesh cover.jpg', images: ['images/IMG_1298.JPG', 'images/IMG_1284.JPG', 'images/IMG_1285.JPG', 'images/IMG_1286.JPG', 'images/IMG_1287.JPG', 'images/IMG_1288.JPG', 'images/IMG_1289.JPG', 'images/IMG_1290.JPG', 'images/IMG_1291.JPG', 'images/IMG_1292.JPG', 'images/IMG_1293.JPG', 'images/IMG_1294.JPG', 'images/IMG_1295.JPG', 'images/IMG_1296.JPG', 'images/IMG_1297.JPG'], order: 0 },
  { title: 'Holi Hai', description: 'An artful embrace of Holi, where colors collide, hearts unite, and every splash becomes a verse of celebration.', coverImage: 'images/holi_cover.jpg', images: ['images/IMG_0460.JPG', 'images/IMG_0461.JPG', 'images/IMG_0462.JPG', 'images/IMG_0463.JPG', 'images/IMG_0464.JPG', 'images/IMG_0465.JPG', 'images/IMG_0466.JPG', 'images/IMG_0467.JPG', 'images/IMG_0468.JPG', 'images/IMG_0469.JPG', 'images/IMG_0470.JPG', 'images/IMG_0471.JPG', 'images/IMG_0472.JPG', 'images/IMG_0473.JPG', 'images/IMG_0474.JPG', 'images/IMG_0475.JPG'], order: 1 },
  { title: 'Project. 03', description: 'Moments frozen in time, telling stories through the lens of perspective.', coverImage: 'images/original.jpg', images: ['images/original.jpg', 'images/hxac.jpeg', 'images/IMG_0460.JPG', 'images/IMG_0461.JPG', 'images/IMG_0462.JPG'], order: 2 },
  { title: 'Project. 04', description: 'Capturing the essence of urban landscapes and architectural beauty.', coverImage: 'images/hxac.jpeg', images: ['images/hxac.jpeg', 'images/original.jpg', 'images/IMG_1284.JPG', 'images/IMG_1285.JPG', 'images/IMG_1286.JPG'], order: 3 },
  { title: 'Project. 05', description: 'A visual journey through color, light, and shadow in everyday scenes.', coverImage: 'images/IMG_0460.JPG', images: ['images/original.jpg', 'images/IMG_0463.JPG', 'images/IMG_0464.JPG', 'images/IMG_0465.JPG', 'images/IMG_0466.JPG'], order: 4 },
  { title: 'Project. 06', description: 'Documenting the raw beauty found in unexpected places and moments.', coverImage: 'images/taj_mahal.jpg', images: ['images/taj_mahal.jpg', 'images/IMG_1287.JPG', 'images/IMG_1288.JPG', 'images/IMG_1289.JPG', 'images/IMG_1290.JPG'], order: 5 },
];

async function seed() {
  await mongoose.connect(config.mongodbUri);
  const count = await Project.countDocuments();
  if (count === 0) {
    await Project.insertMany(defaultProjects);
    console.log('Seeded', defaultProjects.length, 'projects');
  } else {
    console.log('Projects already exist, skipping seed');
  }
  await Setting.findOneAndUpdate({ key: 'viewMore' }, { key: 'viewMore', value: { enabled: true, limit: 6 }, updatedAt: new Date() }, { upsert: true });
  console.log('Settings ready');
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
