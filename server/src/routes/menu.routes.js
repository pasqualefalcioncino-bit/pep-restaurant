const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const menuController = require("../controllers/menu.controller");
const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

const menuImagesDir = path.resolve(__dirname, "../../../client/src/assets/images/menu");
const allowedImageTypes = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const allowedImageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

const slugifyFileName = (fileName) => {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "piatto"}-${Date.now()}${extension}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(menuImagesDir, { recursive: true });
    cb(null, menuImagesDir);
  },
  filename: (req, file, cb) => {
    cb(null, slugifyFileName(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      !allowedImageTypes.includes(file.mimetype) ||
      !allowedImageExtensions.includes(extension)
    ) {
      return cb(new Error("Formato immagine non supportato"));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// pubblico
router.get("/", menuController.getMenu);

// solo ADMIN
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  menuController.createMenu
);

router.post(
  "/upload-image",
  verifyToken,
  checkRole("admin"),
  (req, res) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).send(err.message);
      }

      if (!req.file) {
        return res.status(400).send("Nessuna immagine caricata");
      }

      res.status(201).json({ fileName: req.file.filename });
    });
  }
);

router.patch(
  "/:id/availability",
  verifyToken,
  checkRole(["admin", "cuoco"]),
  menuController.updateAvailability
);

router.put(
  "/:id",
  verifyToken,
  checkRole("admin"),
  menuController.updateMenu
);

router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  menuController.deleteMenu
);

module.exports = router;
