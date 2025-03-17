require("dotenv").config();

const express = require("express");
const db = require("./db");
const cors = require("cors");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads")); // Ensure uploaded images are accessible

// IMAGES UPLOAD USING MULTER START
// Ensure upload directory exists
const uploadDir = path.join(__dirname, "public/uploads/Images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use timestamp + original file extension
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  },
});

// File filter: Only allow specific image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, PNG, and GIF images are allowed!"));
  }
};

// Multer configuration with file size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit
});

// Upload route
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  const imageUrl = `/uploads/Images/${req.file.filename}`;
  console.log("File uploaded:", req.file);
  console.log("Image URL:", imageUrl);

  res.json({ message: "Image uploaded successfully!", data: { image_url: imageUrl } });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: "Multer error: " + err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});
// IMAGES UPLOAD USING MULTER ENDS

// GET ALL RESTAURANTS
app.get("/api/v1/restaurants", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM restaurants");

    res.status(200).json({
      status: "Success",
      data: {
        restaurants: result.rows, // Return all rows, not just the first one
      },
    });
  } catch (err) {
    console.error(err); // Use console.error for logging errors
    res.status(500).json({ status: "Error", message: "Server error" }); // Send JSON error response
  }
});

// GET A RESTAURANT
app.get("/api/v1/restaurants/:id", async (req, res) => {
  try {
    const result = await db.query("select * from restaurants where id = $1", [
      req.params.id,
    ]);
    console.log(result);
    res.status(200).json({
      status: "Success",
      data: {
        restaurant: result.rows[0],
      },
    });
  } catch (err) {
    console.log(err);
  }
});

// CREATE A RESTAURANT
app.post("/api/v1/restaurants", async (req, res) => {
  try {
    const result = await db.query(
      "insert into restaurants (rname, location, price_range, image_url) values ($1,$2,$3,$4) returning *",
      [
        req.body.rname,
        req.body.location,
        req.body.price_range,
        req.body.image_url,
      ]
    );
    res.status(201).json({
      status: "Success",
      data: {
        restaurants: result.rows[0],
      },
    });
  } catch (err) {
    console.log(err);
  }
});
// RESTAURANT CRUD STARTS 

// UPDATE A RESTAURANT
app.put("/api/v1/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rname, location, price_range, image_url } = req.body;
    const updatedRestaurant = await db.query(
      "UPDATE restaurants SET rname = $1, location = $2, price_range = $3, image_url = $4 WHERE id = $5 RETURNING *",
      [rname, location, price_range, image_url, id]
    );
    res.json({ status: "success", data: updatedRestaurant.rows[0] });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE A RESTAURANT
app.delete("/api/v1/restaurants/:id", async (req, res) => {
  try {
    const result = await db.query("delete from restaurants where id = $1", [
      req.params.id,
    ]);
    console.log(result);
    res.status(201).json({
      status: "Success",
    });
  } catch (err) {
    console.log(err);
  }
});
// RESTAURANT CRUD ENDS 

app.listen(port, () => {
  console.log(`Server is up running and listening on port ${port}`);
});
