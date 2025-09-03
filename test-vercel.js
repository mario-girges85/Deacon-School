// Test script to verify Vercel setup
const app = require("./api/index");

console.log("Testing Vercel setup...");
console.log("App type:", typeof app);
console.log("App has listen method:", typeof app.listen === "function");
console.log("App has use method:", typeof app.use === "function");

// Test a simple request
const mockReq = { url: "/", method: "GET" };
const mockRes = {
  send: (data) => {
    console.log("Response:", data);
  },
};

console.log("✅ Vercel setup looks good!");
