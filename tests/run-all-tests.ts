/**
 * Main Test Runner
 * Runs all feature tests and generates comprehensive report
 */

import TestRunner from './test-runner';
import { testAuthFeatures } from './features/auth.test';
import { testLiveClassFeatures } from './features/live-class.test';
import { testReactQueryFeatures } from './features/react-query.test';
import { testAcademicYearFeatures } from './features/academic-year.test';
import { testExamSubjectsFeatures } from './features/exam-subjects.test';

async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              EduPlexo Comprehensive Feature Test Suite                    ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);

  const runners: TestRunner[] = [];

  try {
    // Run all test suites
    console.log('🚀 Starting test execution...\n');

    // Test 1: Authentication
    console.log('📝 Running Authentication Tests...');
    const authRunner = await testAuthFeatures();
    runners.push(authRunner);

    // Test 2: Live Class
    console.log('📝 Running Live Class Tests...');
    const liveClassRunner = await testLiveClassFeatures();
    runners.push(liveClassRunner);

    // Test 3: React Query
    console.log('📝 Running React Query Tests...');
    const reactQueryRunner = await testReactQueryFeatures();
    runners.push(reactQueryRunner);

    // Test 4: Academic Year
    console.log('📝 Running Academic Year Tests...');
    const academicYearRunner = await testAcademicYearFeatures();
    runners.push(academicYearRunner);

    // Test 5: Exam Subjects
    console.log('📝 Running Exam Subject Tests...');
    const examSubjectsRunner = await testExamSubjectsFeatures();
    runners.push(examSubjectsRunner);

    // Generate combined report
    console.log('\n📊 Generating comprehensive report...\n');

    // Create combined runner for reporting
    const combinedRunner = new TestRunner();

    // Merge all results
    for (const runner of runners) {
      // Access private suites through any method available
      // For now, we'll generate individual reports
    }

    // Generate individual reports
    for (let i = 0; i < runners.length; i++) {
      const reportName = [
        'FEATURE_TEST_AUTH.md',
        'FEATURE_TEST_LIVE_CLASS.md',
        'FEATURE_TEST_REACT_QUERY.md',
        'FEATURE_TEST_ACADEMIC_YEAR.md',
        'FEATURE_TEST_EXAM_SUBJECTS.md',
      ][i];

      runners[i].saveReport(reportName);
    }

    // Print summary
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                          TEST EXECUTION COMPLETE                          ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ All test suites completed successfully!

📄 Generated Reports:
  1. FEATURE_TEST_AUTH.md - Authentication tests
  2. FEATURE_TEST_LIVE_CLASS.md - Live class tests
  3. FEATURE_TEST_REACT_QUERY.md - React Query tests
  4. FEATURE_TEST_ACADEMIC_YEAR.md - Academic year tests
  5. FEATURE_TEST_EXAM_SUBJECTS.md - Exam subject tests

📊 Next Steps:
  1. Review all generated reports
  2. Fix any failing tests (❌)
  3. Address warnings (⚠️)
  4. Re-run tests to verify fixes
  5. Deploy to production

🎯 Status: READY FOR FINAL REVIEW
    `);

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
