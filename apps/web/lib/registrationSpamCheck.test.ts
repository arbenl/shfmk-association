import assert from "node:assert/strict";
import { isSuspiciousRegistration } from "./registrationSpamCheck.ts";

const junkInput = {
  full_name: "jNDNJfWdvXdkKoqeUW",
  email: "aberrios@amerexenergy.com",
  institution: "DkJMljpnxwrUZrAT",
  phone: "3230037861",
};

const normalInput = {
  full_name: "Arben Lila",
  email: "arben@example.com",
  institution: "Barnatore Prishtina",
  phone: "044123123",
};

assert.equal(isSuspiciousRegistration(junkInput), true, "Junk payload should be flagged as suspicious");
assert.equal(isSuspiciousRegistration(normalInput), false, "Normal payload should not be flagged");

console.log("registrationSpamCheck tests passed");
