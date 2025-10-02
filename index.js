const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB лимит
  },
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Для JSON и text/plain
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(express.urlencoded({ extended: true }));

// application/text
app.get("/get-text", (req, res) => {
  res.type("text/plain").send("Hello from GET!");
});
app.post("/post-text", (req, res) => {
  res.type("text/plain").send(`You sent plain text: ${req.body}`);
});
app.put("/put-text", (req, res) => {
  res.type("text/plain").send(`You sent plain text: ${req.body}`);
});
app.delete("/delete-text", (req, res) => {
  res.type("text/plain").send("Hello from DELETE!");
});
// application/text

// form data
app.post("/post-form", (req, res) => {
  res.type("text/plain").send(`Form data: ${JSON.stringify(req.body)}`);
});

app.put("/put-form", (req, res) => {
  res.type("text/plain").send(`Form data: ${JSON.stringify(req.body)}`);
});

app.post("/post-multipart", upload.any(), (req, res) => {
  res
    .type("text/plain")
    .send(
      `Multipart data: ${JSON.stringify(req.body)} ${JSON.stringify(req.files)}`
    );
});

app.put("/put-multipart", upload.any(), (req, res) => {
  res.type("text/plain").send(`Multipart data: ${JSON.stringify(req.body)}`);
});
// form data

// application/json
app.get("/get-json", (req, res) => {
  res.json({
    message: "Hello from GET!",
    method: "GET",
    timestamp: new Date().toISOString(),
    data: { id: 1, name: "Test Item" },
  });
});

app.post("/post-json", (req, res) => {
  res.json({
    message: "Data received successfully!",
    method: "POST",
    receivedData: req.body,
    timestamp: new Date().toISOString(),
    status: "success",
  });
});

app.put("/put-json", (req, res) => {
  res.json({
    message: "Data updated successfully!",
    method: "PUT",
    updatedData: req.body,
    timestamp: new Date().toISOString(),
    id: req.params.id || 1,
  });
});

app.delete("/delete-json", (req, res) => {
  res.json({
    message: "Item deleted successfully!",
    method: "DELETE",
    timestamp: new Date().toISOString(),
    deletedId: req.params.id || 1,
    status: "deleted",
  });
});
// application/json

// files
app.post("/upload-single", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
      message: "Please provide a file with key 'file'",
    });
  }

  res.json({
    message: "File uploaded successfully!",
    method: "POST",
    file: {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
    },
    timestamp: new Date().toISOString(),
  });
});

app.post("/upload-multiple", upload.array("files", 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: "No files uploaded",
      message: "Please provide files with key 'files'",
    });
  }

  res.json({
    message: "Files uploaded successfully!",
    method: "POST",
    files: req.files.map((file) => ({
      originalname: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    })),
    count: req.files.length,
    timestamp: new Date().toISOString(),
  });
});

// Стриминг файла для скачивания
app.get("/download-file/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  // Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: "File not found",
      message: `File ${filename} does not exist`,
    });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Поддержка range requests для продолжения загрузки
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "application/octet-stream",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Полная загрузка файла
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename=${filename}`,
    };

    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Просмотр файла (без скачивания)
app.get("/view-file/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const mimeType = getMimeType(filename);

  res.setHeader("Content-Type", mimeType);
  fs.createReadStream(filePath).pipe(res);
});

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".txt": "text/plain",
    ".json": "application/json",
  };
  return mimeTypes[ext] || "application/octet-stream";
}
// files

// Стриминг больших JSON данных
app.get("/stream-large-json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.write("[");

  // Генерируем большой JSON массив по частям
  const itemsCount = 1000;

  for (let i = 0; i < itemsCount; i++) {
    const item = {
      id: i + 1,
      name: `Item ${i + 1}`,
      timestamp: new Date().toISOString(),
      data: Array(100).fill("x").join(""), // Имитация больших данных
    };

    res.write(JSON.stringify(item));

    if (i < itemsCount - 1) {
      res.write(",");
    }

    // Имитация задержки для демонстрации стриминга
    if (i % 100 === 0) {
      setTimeout(() => {}, 10);
    }
  }

  res.write("]");
  res.end();
});

// Чанковый стриминг текста
app.get("/stream-text", (req, res) => {
  res.setHeader("Content-Type", "text/plain");

  const streamText = "Hello from streaming endpoint!\n".repeat(100);
  const chunkSize = 100;

  let position = 0;

  const sendChunk = () => {
    if (position < streamText.length) {
      const chunk = streamText.slice(position, position + chunkSize);
      res.write(chunk);
      position += chunkSize;
      setTimeout(sendChunk, 50); // Задержка между чанками
    } else {
      res.end();
    }
  };

  sendChunk();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
