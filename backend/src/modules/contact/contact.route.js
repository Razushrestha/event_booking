const adminMiddleware  = require("../../middlewares/adminMiddleware");

const express = require("express");

const router = express.Router();

const { createContact, getAllContactsByAdmin, deleteContact } = require("./contact.method");

router.post("/contact", createContact);

router.delete("/contact/:contactId", adminMiddleware, deleteContact);

router.get("/contact", adminMiddleware, getAllContactsByAdmin);

module.exports = router;