const baseURL = "http://localhost:8080";
const superAdminEmail = "eduplexo@gmail.com";
const superAdminPass = "Test@123";

async function main() {
  const loginRes = await fetch(`${baseURL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: superAdminEmail, password: superAdminPass, role: "admin" })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  
  const res = await fetch(`${baseURL}/api/super-admin/schools`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("Schools list response data:", JSON.stringify(data, null, 2));
}
main().catch(console.error);
