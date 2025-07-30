import "../bootstrap";

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  dialect: process.env.DB_DIALECT || "postgres",
  timezone: "-03:00",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: String(process.env.DB_PASS || ""),
  logging: process.env.DB_DEBUG === "true",
  dialectOptions: {
    ssl: process.env.NODE_ENV === "production" ? {
      require: false,
      rejectUnauthorized: false
    } : false
  }
};
