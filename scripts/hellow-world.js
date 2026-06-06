#!/usr/bin/env node

/**
 * Eduplexo Instant VPS Data Wipe & Reset Script
 * 
 * Run this to instantly stop all eduplexo containers, wipe volumes, and restart clean.
 * Usage: node scripts/delet-all-data.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Resolve project root dynamically (handles running from root or scripts directory)
const projectDir = fs.existsSync(path.join(__dirname, '..', 'vps'))
  ? path.dirname(__dirname)
  : process.cwd();

const composeFile = path.join(projectDir, 'vps', 'docker-compose.vps.yml');
const envFile = path.join(projectDir, 'vps', '.env.vps');

console.log("=========================================================");
console.log("   EDUPLEXO INSTANT VPS DATA WIPE & RESET SCRIPT         ");
console.log("=========================================================");
console.log("Project Directory: " + projectDir);
console.log("Compose File:      " + composeFile);
console.log("Env File:          " + envFile);
console.log("=========================================================");

// 1. Stop and remove any running eduplexo containers
console.log("\n[1/3] Stopping and removing all eduplexo containers...");
try {
  const containers = execSync("docker ps -a --filter name=eduplexo --format '{{.Names}}'")
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);

  if (containers.length > 0) {
    console.log("Found containers: " + containers.join(', '));
    console.log("Stopping...");
    execSync("docker ps -q --filter name=eduplexo | xargs -r docker stop", { stdio: 'inherit' });
    console.log("Removing...");
    execSync("docker ps -a -q --filter name=eduplexo | xargs -r docker rm", { stdio: 'inherit' });
  } else {
    console.log("No running eduplexo containers found.");
  }
} catch (err) {
  console.log("Note: Container cleanup step info: " + err.message);
}

// 2. Force remove postgres & redis volumes
console.log("\n[2/3] Wiping database volumes...");
try {
  execSync("docker volume rm -f eduplexo_vps_postgres eduplexo_vps_redis", { stdio: 'inherit' });
  console.log("✓ PostgreSQL and Redis volumes destroyed successfully.");
} catch (err) {
  console.error("X Error destroying volumes: " + err.message);
}

// 3. Restart stack (if docker compose file exists)
console.log("\n[3/3] Restarting services...");
if (fs.existsSync(composeFile)) {
  const envArg = fs.existsSync(envFile) ? `--env-file "${envFile}"` : "";
  try {
    console.log("Starting database services...");
    execSync(`docker compose -f "${composeFile}" ${envArg} up -d postgres redis`, { stdio: 'inherit' });
    
    console.log("Waiting 10 seconds for databases to initialize...");
    execSync("sleep 10");

    console.log("Running migrations...");
    execSync(`docker compose -f "${composeFile}" ${envArg} up migrate`, { stdio: 'inherit' });

    console.log("Starting backend, chatbot, and nginx...");
    execSync(`docker compose -f "${composeFile}" ${envArg} up -d backend-go edubot nginx`, { stdio: 'inherit' });
    console.log("\n✓ Stack restarted successfully with clean databases.");
  } catch (err) {
    console.error("X Error restarting stack: " + err.message);
  }
} else {
  console.log("Note: docker-compose.vps.yml not found. Wiped database volumes successfully.");
}

console.log("\n=========================================================");
console.log("✓ Done!");
console.log("=========================================================");
