export function getTransformDayTimeToSecondsTestCases() {
  return [
    { dayTime: '00:00:00', expected: 0 },
    { dayTime: '14:10:00', expected: 51_000 },
    { dayTime: '00:04:20', expected: 260 },
  ];
}

export function getExtractDayTimeInSecondsTestCases() {
  return [
    { date: '2021-10-25T00:00:00.084Z', expected: 0 },
    { date: '2021-10-25T14:10:00.084Z', expected: 51_000 },
    { date: '2021-10-25T00:04:20.084Z', expected: 260 },
  ];
}
