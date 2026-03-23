const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const { createServer } = require('http');
const { Server } = require('socket.io');
const XLSX = require('xlsx');

// Disable Mongoose buffering so commands fail immediately when not connected
mongoose.set('bufferCommands', false);

const config = require('./config');
const Project = require('./models/Project');
const Setting = require('./models/Setting');

let dbConnected = false;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + (file.originalname || 'image')),
});
const upload = multer({ storage });

const ensureUploadsDir = () => {
  const fs = require('fs');
  const dir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureUploadsDir();

const authMiddleware = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token === config.adminPassword) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

io.on('connection', (socket) => socket.join('public'));
function broadcastUpdate() { io.to('public').emit('content-updated'); }

function getExportUrl() {
  if (!config.googleScriptUrl || !config.googleSheetExportKey) return null;
  return `${config.googleScriptUrl}?key=${encodeURIComponent(config.googleSheetExportKey)}&action=export`;
}

function buildTelegramMessage(data) {
  const lines = [
    'New Contact Submission',
    '',
    `Name: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || '-'}`,
    '',
    'Message:',
    data.message,
    '',
    `Timestamp: ${data.timestamp}`,
  ];
  return lines.join('\n');
}

async function sendTelegramNotification(data) {
  if (!config.telegramBotToken || !config.telegramChatId) return false;

  const telegramUrl = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  const response = await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text: buildTelegramMessage(data),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Telegram API error: ${errText}`);
  }

  return true;
}

async function saveSubmissionToGoogleScript(data) {
  if (!config.googleScriptUrl) return false;

  const response = await fetch(config.googleScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Script error: ${errText}`);
  }

  return true;
}

app.get('/api/config', (req, res) => {
  res.json({ googleScriptUrl: config.googleScriptUrl || '' });
});

app.post('/api/contact', async (req, res) => {
  const firstName = (req.body.firstName || '').trim();
  const lastName = (req.body.lastName || '').trim();
  const email = (req.body.email || '').trim();
  const phone = (req.body.phone || '').trim();
  const message = (req.body.message || '').trim();

  if (!firstName || !email || !message) {
    return res.status(400).json({ error: 'firstName, email, and message are required.' });
  }

  const payload = {
    firstName,
    lastName,
    email,
    phone,
    message,
    timestamp: new Date().toISOString(),
  };

  let googleSaved = false;
  let telegramSent = false;
  const errors = [];

  try {
    googleSaved = await saveSubmissionToGoogleScript(payload);
  } catch (err) {
    errors.push(err.message);
  }

  try {
    telegramSent = await sendTelegramNotification(payload);
  } catch (err) {
    errors.push(err.message);
  }

  if (!googleSaved && !telegramSent) {
    return res.status(502).json({
      error: 'Submission could not be delivered.',
      details: errors,
    });
  }

  res.json({
    ok: true,
    googleSaved,
    telegramSent,
    warnings: errors,
  });
});

app.get('/api/projects', async (req, res) => {
  if (!dbConnected) return res.json({ projects: [], viewMoreEnabled: true, limit: 6 });
  try {
    const setting = await Setting.findOne({ key: 'viewMore' });
    const viewMoreEnabled = setting ? setting.value.enabled : true;
    const limit = setting ? (setting.value.limit || 6) : 6;
    const projects = await Project.find().sort({ order: 1 });
    res.json({ projects, viewMoreEnabled, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/full', authMiddleware, async (req, res) => {
  if (!dbConnected) return res.json([]);
  try {
    const projects = await Project.find().sort({ order: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', authMiddleware, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const count = await Project.countDocuments();
    const project = await Project.create({ ...req.body, order: count });
    broadcastUpdate();
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/projects/:id', authMiddleware, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ error: 'Not found' });
    broadcastUpdate();
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    broadcastUpdate();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', authMiddleware, upload.array('images', 20), (req, res) => {
  const urls = (req.files || []).map((f) => '/uploads/' + f.filename);
  res.json({ urls });
});

app.post('/api/projects/:id/images', authMiddleware, upload.array('images', 20), async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    const urls = (req.files || []).map((f) => '/uploads/' + f.filename);
    project.images = [...(project.images || []), ...urls];
    await project.save();
    broadcastUpdate();
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/projects/:id/images', authMiddleware, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, { images: req.body.images || [] }, { new: true });
    if (!project) return res.status(404).json({ error: 'Not found' });
    broadcastUpdate();
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/settings', authMiddleware, async (req, res) => {
  if (!dbConnected) return res.json({ enabled: true, limit: 6 });
  try {
    const setting = await Setting.findOne({ key: 'viewMore' });
    res.json(setting ? setting.value : { enabled: true, limit: 6 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database not connected' });
  try {
    await Setting.findOneAndUpdate(
      { key: 'viewMore' },
      { key: 'viewMore', value: req.body, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    broadcastUpdate();
    res.json(req.body);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth', (req, res) => {
  if (req.body.password === config.adminPassword) {
    res.json({ token: config.adminPassword });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/submissions', authMiddleware, async (req, res) => {
  try {
    const url = getExportUrl();
    if (!url) return res.json([]);
    const resp = await fetch(url);
    const data = await resp.json();
    res.json(data.submissions || []);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/submissions/csv', authMiddleware, async (req, res) => {
  try {
    const url = getExportUrl();
    if (!url) return res.status(400).send('GOOGLE_SCRIPT_URL and GOOGLE_SHEET_EXPORT_KEY required in .env');
    const resp = await fetch(url);
    const data = await resp.json();
    const rows = data.submissions || [];
    const headers = ['Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Message'];
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=submissions.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/submissions/xlsx', authMiddleware, async (req, res) => {
  try {
    const url = getExportUrl();
    if (!url) return res.status(400).send('GOOGLE_SCRIPT_URL and GOOGLE_SHEET_EXPORT_KEY required in .env');
    const resp = await fetch(url);
    const data = await resp.json();
    const rows = data.submissions || [];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Submissions');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=submissions.xlsx');
    res.send(buf);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

function startServer() {
  httpServer.listen(config.port, () => {
    console.log('');
    console.log('========================================');
    console.log('  Harsha Kaptures - Photography Portfolio');
    console.log('========================================');
    console.log('');
    console.log('  Website:  http://localhost:' + config.port);
    console.log('  Admin:    http://localhost:' + config.port + '/admin');
    console.log('');
    console.log('  Press Ctrl+C to stop');
    console.log('========================================');
    console.log('');
  });
}

mongoose.connect(config.mongodbUri).then(() => {
  console.log('MongoDB connected successfully.');
  dbConnected = true;
  startServer();
}).catch((err) => {
  console.warn('MongoDB connection failed:', err.message);
  console.warn('Starting in frontend-only mode (no database)...');
  startServer();
});
