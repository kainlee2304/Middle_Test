// File: index.js
const express = require("express");
const pool = require("./db");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Tạo bảng products nếu chưa có
pool
  .query(
    `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  )
  .then(() => console.log("Bảng products sẵn sàng!"));

// Middleware validate dữ liệu
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;
  if (!name || !price || isNaN(price) || price < 0) {
    return res
      .status(400)
      .json({ error: "Tên và giá hợp lệ là bắt buộc, giá phải là số dương!" });
  }
  next();
};

// Route hiển thị giao diện
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Chức năng 1: Thêm sản phẩm
app.post("/products", validateProduct, async (req, res) => {
  const { name, price } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *",
      [name, price]
    );
    res
      .status(201)
      .json({ message: "Thêm sản phẩm thành công!", product: result.rows[0] });
  } catch (err) {
    console.error("Lỗi thêm sản phẩm:", err);
    res.status(500).json({ error: "Lỗi server, thử lại nha!" });
  }
});

// Chức năng 2: Tìm kiếm sản phẩm theo tên
app.get("/products", async (req, res) => {
  const { search } = req.query;
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE name ILIKE $1",
      [`%${search || ""}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi tìm kiếm:", err);
    res.status(500).json({ error: "Không tìm thấy gì, sorry nha!" });
  }
});

// Chức năng 3: Lấy tất cả sản phẩm
app.get("/products/all", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi lấy danh sách:", err);
    res.status(500).json({ error: "Lỗi server, thử lại nha!" });
  }
});

// Chức năng 4: Cập nhật sản phẩm
app.put("/products/:id", validateProduct, async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  try {
    const result = await pool.query(
      "UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *",
      [name, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại!" });
    }
    res.json({
      message: "Cập nhật sản phẩm thành công!",
      product: result.rows[0],
    });
  } catch (err) {
    console.error("Lỗi cập nhật:", err);
    res.status(500).json({ error: "Lỗi server, thử lại nha!" });
  }
});

// Chức năng 5: Xóa sản phẩm
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại!" });
    }
    res.json({ message: "Xóa sản phẩm thành công!", product: result.rows[0] });
  } catch (err) {
    console.error("Lỗi xóa:", err);
    res.status(500).json({ error: "Lỗi server, thử lại nha!" });
  }
});

// Khởi động server
console.log("Server đang khởi động...");
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server chạy ngon lành trên port ${PORT}!`);
});
