const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");

const app = express();
const upload = multer({ dest: "uploads/" });

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
