const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

// Для JSON и text/plain
app.use(bodyParser.json());
app.use(bodyParser.text());

// GET – простой текст
app.get("/get-text", (req, res) => {
  res.type("text/plain").send("Hello from GET!");
});

// POST JSON
app.post("/post-json", (req, res) => {
  res.json({ received: req.body, status: "ok" });
});

// POST text/plain
app.post("/post-text", (req, res) => {
  res.type("text/plain").send(`You sent plain text: ${req.body}`);
});

// POST multipart form
app.post("/post-form", upload.none(), (req, res) => {
  res.json({ received: req.body, status: "form received" });
});

// POST file upload
app.post("/upload-file", upload.single("file"), (req, res) => {
  res.json({
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// GET file streaming
app.get("/download-file", (req, res) => {
  const content = "Some test file content\nLine 2\nLine 3";
  res.setHeader("Content-Disposition", "attachment; filename=test.txt");
  res.setHeader("Content-Type", "application/octet-stream");
  res.send(content);
});

// PUT – update ресурс
app.put("/update/:id", (req, res) => {
  res.json({ id: req.params.id, new_data: req.body, status: "updated" });
});

// DELETE – удалить ресурс
app.delete("/delete/:id", (req, res) => {
  res.json({ id: req.params.id, status: "deleted" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
