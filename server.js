
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const venom = require('venom-bot');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(__dirname + '/uploads'));

const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
let clientWA = null;

venom
  .create()
  .then(client => {
    clientWA = client;
  })
  .catch(console.error);

app.get('/api/products', (req, res) => {
  const data = JSON.parse(fs.readFileSync('products.json', 'utf-8'));
  res.json(data);
});

app.post('/api/products', (req, res) => {
  if (req.headers.authorization !== `Bearer ${adminPassword}`)
    return res.status(403).send('Forbidden');

  const { nama, harga } = req.body;
  const image = req.files?.image;
  const filePath = 'uploads/' + image.name;

  image.mv(filePath, err => {
    if (err) return res.status(500).send('Upload failed');
    let data = JSON.parse(fs.readFileSync('products.json', 'utf-8'));
    data.push({ nama, harga, gambar: filePath });
    fs.writeFileSync('products.json', JSON.stringify(data));
    res.send('Produk ditambahkan');
  });
});

app.post('/api/order', (req, res) => {
  const order = req.body;
  const sales = JSON.parse(fs.readFileSync('sales-log.json', 'utf-8'));
  sales.push({ ...order, date: new Date().toISOString() });
  fs.writeFileSync('sales-log.json', JSON.stringify(sales));

  if (clientWA) {
    clientWA.sendText(process.env.ADMIN_WA || '628xxxxxxxxxx@c.us', `Pesanan baru:
${JSON.stringify(order)}`);
  }

  res.send('Pesanan diterima');
});

app.listen(3000, () => console.log('Server running on port 3000'));
