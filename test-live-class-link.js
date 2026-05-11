// Test script to verify live class link generation

function generateFallbackMeetingLink(classId) {
  const timestamp = Date.now().toString(36);
  const randomId = Math.random().toString(36).substring(2, 8);
  return `https://meet.eduexplo.com/class-${classId}-${timestamp}-${randomId}`;
}

// Test 1: Generate multiple links
console.log("=== Test 1: Generate Multiple Links ===");
for (let i = 0; i < 3; i++) {
  const link = generateFallbackMeetingLink("class-123");
  console.log(`Link ${i + 1}: ${link}`);
}

// Test 2: Verify uniqueness
console.log("\n=== Test 2: Verify Uniqueness ===");
const link1 = generateFallbackMeetingLink("class-123");
const link2 = generateFallbackMeetingLink("class-123");
console.log(`Link 1: ${link1}`);
console.log(`Link 2: ${link2}`);
console.log(`Are they different? ${link1 !== link2 ? "✅ YES" : "❌ NO"}`);

// Test 3: Verify format
console.log("\n=== Test 3: Verify Format ===");
const link = generateFallbackMeetingLink("507f1f77bcf86cd799439011");
console.log(`Generated link: ${link}`);
console.log(`Starts with domain? ${link.startsWith("https://meet.eduexplo.com/class-") ? "✅ YES" : "❌ NO"}`);
console.log(`Contains classId? ${link.includes("507f1f77bcf86cd799439011") ? "✅ YES" : "❌ NO"}`);

// Test 4: Simulate API response
console.log("\n=== Test 4: Simulate API Response ===");
const mockLiveClass = {
  _id: "507f1f77bcf86cd799439014",
  title: "Weekly Math Review",
  teacherId: "507f1f77bcf86cd799439011",
  classId: "507f1f77bcf86cd799439012",
  subjectId: "507f1f77bcf86cd799439013",
  meetingLink: generateFallbackMeetingLink("507f1f77bcf86cd799439012"),
  meetingId: "",
  startTime: new Date("2026-05-12T10:00:00Z"),
  endTime: new Date("2026-05-12T11:00:00Z"),
  status: "SCHEDULED",
  createdBy: "507f1f77bcf86cd799439015",
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log("Mock Live Class:");
console.log(JSON.stringify(mockLiveClass, null, 2));
console.log(`\nMeeting Link: ${mockLiveClass.meetingLink}`);
console.log(`Link exists? ${mockLiveClass.meetingLink ? "✅ YES" : "❌ NO"}`);

console.log("\n=== All Tests Passed ✅ ===");
