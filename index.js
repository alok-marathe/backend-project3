const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');
const shortid = require('shortid');
const { URL } = require('url');
require('dotenv').config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const Url = mongoose.model('Url', urlSchema);

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;
  let urlObject;
  try {
    urlObject = new URL(url);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(urlObject.hostname, async (err, addresses) => {
    if (err) return res.json({ error: 'invalid url' });

    const shortUrl = shortid.generate();
    const newUrl = new Url({
      original_url: url,
      short_url: shortUrl
    });

    try {
      const savedUrl = await newUrl.save();
      res.json({ original_url: savedUrl.original_url, short_url: savedUrl.short_url });
    } catch (err) {
      res.json({ error: 'failed to save url' });
    }
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;

  try {
    const foundUrl = await Url.findOne({ short_url: shortUrl });
    if (!foundUrl) {
      return res.json({ error: 'No short URL found for the given input' });
    }
    res.redirect(foundUrl.original_url);
  } catch (err) {
    res.json({ error: 'No short URL found for the given input' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
