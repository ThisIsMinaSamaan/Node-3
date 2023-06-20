const express = require("express");
const axios = require("axios");
const { writeFile, writeFileSync } = require("fs");

const app = express();

const getData = async function () {
  try {
    const res = await axios.get("https://api.escuelajs.co/api/v1/products");
    const data = res.data;
    return data;
  } catch (error) {
    console.error("unable to fetch data", error);
    throw error;
  }
};

const getExchangeRate = async function (currencyCode) {
  try {
    const res = await axios.get(
      `https://v6.exchangerate-api.com/v6/8a946c17762fa2c30024f5f8/latest/USD`
    );
    const exchangeRate = res.data.conversion_rates[currencyCode];
    return exchangeRate;
  } catch (error) {
    console.error("unable to fetch exchange rate", error);
    throw error;
  }
};

const convertingPrice = function (products, exchangeRate) {
  products.forEach((product) => {
    product.price = parseFloat((product.price * exchangeRate).toFixed(2));
  });
  return products;
};

const categorize = function (products) {
  const productsList = {};
  products.forEach((product) => {
    const { category } = product;
    if (!productsList[category.id]) {
      productsList[category.id] = {
        category: {
          id: category.id,
          name: category.name,
        },
        products: [],
      };
    }
    productsList[category.id].products.push(product);
  });
  return Object.values(productsList);
};

app.get("/products", async (req, res) => {
  try {
    const currencyCode = req.query.CUR;
    if (!currencyCode) {
      res.status(400).json({ error: "Currency code is required." });
      return;
    }

    const data = await getData();
    const exchangeRate = await getExchangeRate(currencyCode);
    const afterPriceChange = convertingPrice(data, exchangeRate);
    const afterCatergorization = categorize(afterPriceChange);
    console.log("Final Output:", afterCatergorization);
    res.json(afterCatergorization);
  } catch (error) {
    console.error("error occurred:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(5500, () => {
  console.log("Server is running on port 5500");
});
