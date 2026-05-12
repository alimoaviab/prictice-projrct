/**
 * Comprehensive Test Runner for EduPlexo
 * Tests all major features and generates a detailed report
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  duration: number;
  message: string;
  details?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTime: number;
  passed: number;
  failed: number;
  warnings: number;
}

class TestRunner {
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;
  private startTime: number = 0;

  startSuite(name: string) {
    this.currentSuite = {
      name,
      tests: [],
      totalTime: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    };
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 Starting Test Suite: ${name}`);
    console.log(`${'='.repeat(80)}\n`);
  }

  async test(name: string, fn: () => Promise<void> | void) {
    if (!this.currentSuite) {
      throw new Error('No test suite started');
    }

    this.startTime = Date.now();
    const result: TestResult = {
      name,
      status: 'PASS',
      duration: 0,
      message: 'Test passed',
    };

    try {
      await fn();
      result.status = 'PASS';
      result.message = '✅ Test passed';
      this.currentSuite.passed++;
    } catch (error: any) {
      result.status = 'FAIL';
      result.message = `❌ Test failed: ${error.message}`;
      result.details = error.stack;
      this.currentSuite.failed++;
    }

    result.duration = Date.now() - this.startTime;
    this.currentSuite.tests.push(result);

    console.log(`${result.message} (${result.duration}ms)`);
    if (result.details) {
      console.log(`  Details: ${result.details.split('\n')[0]}`);
    }
  }

  warn(name: string, message: string) {
    if (!this.currentSuite) {
      throw new Error('No test suite started');
    }

    const result: TestResult = {
      name,
      status: 'WARN',
      duration: 0,
      message: `⚠️  Warning: ${message}`,
    };

    this.currentSuite.warnings++;
    this.currentSuite.tests.push(result);
    console.log(result.message);
  }

  endSuite() {
    if (!this.currentSuite) {
      throw new Error('No test suite started');
    }

    this.currentSuite.totalTime = this.currentSuite.tests.reduce((sum, t) => sum + t.duration, 0);
    this.suites.push(this.currentSuite);

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Suite Summary: ${this.currentSuite.passed} passed, ${this.currentSuite.failed} failed, ${this.currentSuite.warnings} warnings`);
    console.log(`Total Time: ${this.currentSuite.totalTime}ms`);
    console.log(`${'─'.repeat(80)}\n`);

    this.currentSuite = null;
  }

  generateReport(): string {
    const timestamp = new Date().toISOString();
    let report = `# EduPlexo Comprehensive Test Report\n\n`;
    report += `**Generated**: ${timestamp}\n\n`;

    // Summary
    const totalTests = this.suites.reduce((sum, s) => sum + s.tests.length, 0);
    const totalPassed = this.suites.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = this.suites.reduce((sum, s) => sum + s.failed, 0);
    const totalWarnings = this.suites.reduce((sum, s) => sum + s.warnings, 0);
    const totalTime = this.suites.reduce((sum, s) => sum + s.totalTime, 0);

    report += `## Summary\n\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Total Tests | ${totalTests} |\n`;
    report += `| Passed | ${totalPassed} ✅ |\n`;
    report += `| Failed | ${totalFailed} ❌ |\n`;
    report += `| Warnings | ${totalWarnings} ⚠️ |\n`;
    report += `| Total Time | ${totalTime}ms |\n`;
    report += `| Success Rate | ${((totalPassed / totalTests) * 100).toFixed(2)}% |\n\n`;

    // Detailed Results
    report += `## Detailed Results\n\n`;

    for (const suite of this.suites) {
      report += `### ${suite.name}\n\n`;
      report += `**Status**: ${suite.failed === 0 ? '✅ All tests passed' : `❌ ${suite.failed} test(s) failed`}\n\n`;

      for (const test of suite.tests) {
        const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
        report += `- ${icon} **${test.name}** (${test.duration}ms)\n`;
        report += `  - ${test.message}\n`;
        if (test.details) {
          report += `  - Details: ${test.details}\n`;
        }
      }

      report += `\n`;
    }

    // Recommendations
    report += `## Recommendations\n\n`;

    if (totalFailed > 0) {
      report += `### Critical Issues\n`;
      for (const suite of this.suites) {
        for (const test of suite.tests) {
          if (test.status === 'FAIL') {
            report += `- **${suite.name} > ${test.name}**: ${test.message}\n`;
          }
        }
      }
      report += `\n`;
    }

    if (totalWarnings > 0) {
      report += `### Warnings to Address\n`;
      for (const suite of this.suites) {
        for (const test of suite.tests) {
          if (test.status === 'WARN') {
            report += `- **${suite.name} > ${test.name}**: ${test.message}\n`;
          }
        }
      }
      report += `\n`;
    }

    report += `### Performance Optimizations\n`;
    report += `- Consider implementing React Query for data caching\n`;
    report += `- Add request deduplication\n`;
    report += `- Implement lazy loading for large lists\n`;
    report += `- Add pagination to reduce data transfer\n`;
    report += `- Optimize database queries with indexes\n\n`;

    report += `## Next Steps\n\n`;
    report += `1. Fix all critical issues (❌ tests)\n`;
    report += `2. Address warnings (⚠️ tests)\n`;
    report += `3. Implement performance optimizations\n`;
    report += `4. Re-run tests to verify fixes\n`;
    report += `5. Deploy to production\n\n`;

    report += `---\n\n`;
    report += `**Test Runner Version**: 1.0.0\n`;
    report += `**Status**: ${totalFailed === 0 ? '✅ READY FOR PRODUCTION' : '❌ NEEDS FIXES'}\n`;

    return report;
  }

  saveReport(filename: string) {
    const report = this.generateReport();
    const filepath = path.join(process.cwd(), filename);
    fs.writeFileSync(filepath, report);
    console.log(`\n📄 Report saved to: ${filepath}`);
  }

  printSummary() {
    const totalTests = this.suites.reduce((sum, s) => sum + s.tests.length, 0);
    const totalPassed = this.suites.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = this.suites.reduce((sum, s) => sum + s.failed, 0);
    const totalWarnings = this.suites.reduce((sum, s) => sum + s.warnings, 0);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 FINAL TEST SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⚠️  Warnings: ${totalWarnings}`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
    console.log(`${'='.repeat(80)}\n`);

    if (totalFailed === 0) {
      console.log(`✅ ALL TESTS PASSED - READY FOR PRODUCTION\n`);
    } else {
      console.log(`❌ ${totalFailed} TEST(S) FAILED - NEEDS FIXES\n`);
    }
  }
}

export default TestRunner;
