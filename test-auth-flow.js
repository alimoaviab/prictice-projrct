const http = require('http');

async function testFlow() {
  console.log("==> Test Admin Signup");
  const signupRes = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schoolName: "Test Academy " + Date.now(),
      email: "admin" + Date.now() + "@academy.com",
      password: "StrongPassword123",
      confirmPassword: "StrongPassword123"
    })
  });
  
  if (signupRes.status !== 201) {
    console.log("Signup failed:", await signupRes.text());
    process.exit(1);
  }
  
  const signupData = await signupRes.json();
  console.log("Signup success:", signupData);
  
  const email = JSON.parse(signupRes.url.replace(/.*email=/g, "") || '""') || await signupRes.text().match(/admin[0-9]+@academy.com/)?.[0] || 'Unknown';
}
// We can't really do a full E2E without Next.js running. Let's boot it briefly in background.
