#!/usr/bin/env node

const { ensureSchoolProfile, log, okStatus, request } = require("./test-utils");

async function run() {
  log("cyan", "\nSETTINGS TEST\n");
  await ensureSchoolProfile();

  const page = await request("/admin/settings");
  log(okStatus(page.status) ? "green" : "red", `${okStatus(page.status) ? "✓" : "✗"} /admin/settings (${page.status})`);

  const load = await request("/api/settings");
  log(okStatus(load.status) && load.data?.ok ? "green" : "red", `${okStatus(load.status) && load.data?.ok ? "✓" : "✗"} GET /api/settings (${load.status})`);
  if (!load.data?.ok) {
    throw new Error(load.data?.error?.message || "Failed to load settings");
  }

  const updatedPayload = {
    ...load.data.data,
    academy_name: "Test Academy Updated",
    principal_name: "Principal Updated"
  };

  const save = await request("/api/settings", "PATCH", updatedPayload);
  log(okStatus(save.status) && save.data?.ok ? "green" : "red", `${okStatus(save.status) && save.data?.ok ? "✓" : "✗"} PATCH /api/settings (${save.status})`);
  if (!save.data?.ok) {
    throw new Error(save.data?.error?.message || "Failed to save settings");
  }

  const verify = await request("/api/settings");
  const verified = okStatus(verify.status) && verify.data?.ok && verify.data.data.academy_name === "Test Academy Updated";
  log(verified ? "green" : "red", `${verified ? "✓" : "✗"} Verified settings save`);

  if (!verified) {
    throw new Error("Settings update was not persisted.");
  }

  log("green", "Settings test passed\n");
}

run().catch((error) => {
  log("red", `Settings test failed: ${error.message}`);
  process.exit(1);
});