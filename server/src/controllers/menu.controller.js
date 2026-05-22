const menuModel = require("../models/menu.model");

const getMenu = async (req, res) => {
  try {
    const result = await menuModel.getAllMenu();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore server");
  }
};

const createMenu = async (req, res) => {
  const { name, description, price, category, prep_time, image, veg } = req.body;

  try {
    const result = await menuModel.createMenuItem({
      name,
      description,
      price,
      category,
      prep_time,
      image,
      veg,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore inserimento");
  }
};

module.exports = {
  getMenu,
  createMenu,
};
