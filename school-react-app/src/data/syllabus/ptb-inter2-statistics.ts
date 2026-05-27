/**
 * PTB Inter Part-II Statistics Syllabus
 * Chapters 10–17 (continuation from Inter Part-I)
 */

export interface Chapter { id: string; code: string; title: string; type: "chapter"; }
export interface Unit { id: string; title: string; type: "unit"; chapters: Chapter[]; }

export const PTB_INTER2_STATISTICS: Unit[] = [
  {
    id: "chap-10",
    title: "CHAP 10: Normal Distribution",
    type: "unit",
    chapters: [
      { id: "10.1", code: "10.1", title: "Normal Distribution",                type: "chapter" },
      { id: "10.2", code: "10.2", title: "Standard Normal Random Variable",    type: "chapter" },
    ],
  },
  {
    id: "chap-11",
    title: "CHAP 11: Sampling Techniques And Sampling Distribution",
    type: "unit",
    chapters: [
      { id: "11.1",  code: "11.1",  title: "Population (Or Universe)",                                                type: "chapter" },
      { id: "11.2",  code: "11.2",  title: "Sample",                                                                  type: "chapter" },
      { id: "11.3",  code: "11.3",  title: "Sampling Design",                                                         type: "chapter" },
      { id: "11.4",  code: "11.4",  title: "Non-Probability (Non Random) Sampling",                                   type: "chapter" },
      { id: "11.5",  code: "11.5",  title: "Probability (Random) Sampling",                                           type: "chapter" },
      { id: "11.6",  code: "11.6",  title: "Simple Random Sampling",                                                  type: "chapter" },
      { id: "11.7",  code: "11.7",  title: "Stratified Sampling",                                                     type: "chapter" },
      { id: "11.8",  code: "11.8",  title: "Errors",                                                                  type: "chapter" },
      { id: "11.9",  code: "11.9",  title: "Simple Random Sampling And Sample Distribution",                          type: "chapter" },
      { id: "11.10", code: "11.10", title: "Sampling Distribution Of A Statistics",                                   type: "chapter" },
      { id: "11.11", code: "11.11", title: "Sampling Distribution From General Populations",                          type: "chapter" },
      { id: "11.12", code: "11.12", title: "Sampling Distribution Of the Sample Mean",                               type: "chapter" },
      { id: "11.13", code: "11.13", title: "Sampling Distribution Of The Difference Between Two Sample Means",       type: "chapter" },
      { id: "11.14", code: "11.14", title: "Sample Distribution Of Sample Proportion, P",                            type: "chapter" },
      { id: "11.15", code: "11.15", title: "Sampling Distribution Of The Difference Between Two Sample Proportions,", type: "chapter" },
      { id: "11.16", code: "11.16", title: "Other Sampling Distributions",                                            type: "chapter" },
      { id: "11.17", code: "11.17", title: "Sampling Distribution Of The Sample Variance",                           type: "chapter" },
    ],
  },
  {
    id: "chap-12",
    title: "CHAP 12: Estimation",
    type: "unit",
    chapters: [
      { id: "12.1",  code: "12.1",  title: "Statistical Inference",                                                      type: "chapter" },
      { id: "12.2",  code: "12.2",  title: "Statistical Estimation",                                                     type: "chapter" },
      { id: "12.3",  code: "12.3",  title: "Point Estimation Of A Parameter",                                            type: "chapter" },
      { id: "12.4",  code: "12.4",  title: "Unbiasedness",                                                               type: "chapter" },
      { id: "12.5",  code: "12.5",  title: "Best Estimator",                                                             type: "chapter" },
      { id: "12.6",  code: "12.6",  title: "Pooled Estimators From Two Samples",                                         type: "chapter" },
      { id: "12.7",  code: "12.7",  title: "Interval Estimation",                                                        type: "chapter" },
      { id: "12.8",  code: "12.8",  title: "Confidence Interval For Population Means",                                   type: "chapter" },
      { id: "12.9",  code: "12.9",  title: "Confidence Interval For Population Proportion Of Success",                   type: "chapter" },
      { id: "12.10", code: "12.10", title: "Comparative Studies",                                                        type: "chapter" },
      { id: "12.11", code: "12.11", title: "Confidence Interval For Difference Between Two Population Means",            type: "chapter" },
      { id: "12.12", code: "12.12", title: "Confidence Interval For Difference Between Two Population proportions",      type: "chapter" },
    ],
  },
  {
    id: "chap-13",
    title: "CHAP 13: Hypothesis Testing",
    type: "unit",
    chapters: [
      { id: "13.1", code: "13.1", title: "The Elements Of A Test Of Hypothesis",                                                            type: "chapter" },
      { id: "13.2", code: "13.2", title: "Test Of Hypothesis About A Population Means",                                                     type: "chapter" },
      { id: "13.3", code: "13.3", title: "Test Of Hypothesis About A Population Proportion",                                                type: "chapter" },
      { id: "13.4", code: "13.4", title: "Test Of Hypothesis About The Difference Between Two Population-Independent Samples",             type: "chapter" },
      { id: "13.5", code: "13.5", title: "Inferences About The Difference Between Two Population Means-Dependent Samples",                type: "chapter" },
      { id: "13.6", code: "13.6", title: "Test Of Hypothesis About The Difference Between Two Population Between Two Population Proportions", type: "chapter" },
    ],
  },
  {
    id: "chap-14",
    title: "CHAP 14: Simple Linear Regression And Correlation",
    type: "unit",
    chapters: [
      { id: "14.1", code: "14.1", title: "Relations Between Variables",        type: "chapter" },
      { id: "14.2", code: "14.2", title: "Regression Analysis",                type: "chapter" },
      { id: "14.3", code: "14.3", title: "Curve Fitting",                      type: "chapter" },
      { id: "14.4", code: "14.4", title: "Simple Linear Regression",           type: "chapter" },
      { id: "14.5", code: "14.5", title: "The Simple Linear Regression Model", type: "chapter" },
      { id: "14.6", code: "14.6", title: "Simple Linear Correlation",          type: "chapter" },
      { id: "14.7", code: "14.7", title: "Correlation Analysis",               type: "chapter" },
    ],
  },
  {
    id: "chap-15",
    title: "CHAP 15: Association",
    type: "unit",
    chapters: [
      { id: "15.1", code: "15.1", title: "Multinomial Populations",                                    type: "chapter" },
      { id: "15.2", code: "15.2", title: "Attribute (Quality Variable)",                               type: "chapter" },
      { id: "15.3", code: "15.3", title: "Independence Of Attributes",                                 type: "chapter" },
      { id: "15.4", code: "15.4", title: "Association Of A Attributes",                                type: "chapter" },
      { id: "15.5", code: "15.5", title: "Two Dimensional Count Data: Contingency Table",              type: "chapter" },
      { id: "15.6", code: "15.6", title: "Test For Statistical Independence",                          type: "chapter" },
      { id: "15.7", code: "15.7", title: "Rank Correlation",                                           type: "chapter" },
    ],
  },
  {
    id: "chap-16",
    title: "CHAP 16: Analysis Of Time Series",
    type: "unit",
    chapters: [
      { id: "16.1", code: "16.1", title: "Time Series",                      type: "chapter" },
      { id: "16.2", code: "16.2", title: "Components Of Time Series",        type: "chapter" },
      { id: "16.3", code: "16.3", title: "Analysis Of Time Series",         type: "chapter" },
      { id: "16.4", code: "16.4", title: "Estimation Of Secular Trend",     type: "chapter" },
    ],
  },
  {
    id: "chap-17",
    title: "CHAP 17: Orientation Of Computers",
    type: "unit",
    chapters: [
      { id: "17.1",  code: "17.1",  title: "Introduction Of Computer",                                    type: "chapter" },
      { id: "17.2",  code: "17.2",  title: "History Of Computer",                                         type: "chapter" },
      { id: "17.3",  code: "17.3",  title: "Types Of Computer",                                           type: "chapter" },
      { id: "17.4",  code: "17.4",  title: "Classification Of Computers",                                 type: "chapter" },
      { id: "17.5",  code: "17.5",  title: "Hardware And Software",                                       type: "chapter" },
      { id: "17.6",  code: "17.6",  title: "Hardware Components Of A Personal Computer",                  type: "chapter" },
      { id: "17.7",  code: "17.7",  title: "Input Devices And Output Devices",                            type: "chapter" },
      { id: "17.8",  code: "17.8",  title: "System Software",                                             type: "chapter" },
      { id: "17.9",  code: "17.9",  title: "Operating System",                                            type: "chapter" },
      { id: "17.10", code: "17.10", title: "Application Software",                                        type: "chapter" },
      { id: "17.11", code: "17.11", title: "Programming Language",                                        type: "chapter" },
      { id: "17.12", code: "17.12", title: "Language Processors And Translators",                         type: "chapter" },
      { id: "17.13", code: "17.13", title: "Basic Idea Of Writing And Running A Computer Program",        type: "chapter" },
      { id: "17.14", code: "17.14", title: "Number System",                                               type: "chapter" },
      { id: "17.15", code: "17.15", title: "How Computer Represents Data",                               type: "chapter" },
      { id: "17.16", code: "17.16", title: "Binary System As A Foundation Of A Computer Programming",    type: "chapter" },
    ],
  },
];

export function getAllChapters(): Chapter[] { return PTB_INTER2_STATISTICS.flatMap((u) => u.chapters); }
export function getChaptersByUnit(unitId: string): Chapter[] { return PTB_INTER2_STATISTICS.find((u) => u.id === unitId)?.chapters || []; }
export function getUnitByChapterId(chapterId: string): Unit | undefined { return PTB_INTER2_STATISTICS.find((u) => u.chapters.some((ch) => ch.id === chapterId)); }
