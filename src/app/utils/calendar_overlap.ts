import {
  CalendarGroupByClassDetail,
  CalendarGroupBySubjectName,
} from '../types/calendar';
import { countSpecificDayOfWeek } from './date';

export function generateCombinations(
  selectedSubjects: CalendarGroupBySubjectName
): CalendarGroupByClassDetail[][] {
  const subjectKeys = Object.keys(selectedSubjects);
  const combinations: CalendarGroupByClassDetail[][] = [];

  function backtrack(
    index: number,
    currentCombination: CalendarGroupByClassDetail[]
  ) {
    if (index === subjectKeys.length) {
      // clone currentCombination completed result to avoid .pop()
      combinations.push([...currentCombination]);
      return;
    }

    const subjectKey = subjectKeys[index];
    const subjectData = selectedSubjects[subjectKey];
    const classKeys = Object.keys(subjectData.classes);

    classKeys.forEach((classKey) => {
      currentCombination.push(subjectData.classes[classKey]);
      backtrack(index + 1, currentCombination);
      currentCombination.pop();
    });
  }

  backtrack(0, []);

  return combinations;
}

export function calculateOverlap(
  combination: CalendarGroupByClassDetail[]
): number {
  let overlap = 0;
  for (let i = 0; i < combination.length; i++)
    for (let j = i + 1; j < combination.length; j++) {
      const classDetail1 = combination[i];
      const classDetail2 = combination[j];
      for (let session1 of classDetail1.details) {
        for (let session2 of classDetail2.details) {
          if (
            session1.startDate <= session2.endDate &&
            session1.endDate >= session2.startDate &&
            session1.startSession <= session2.endSession &&
            session1.endSession >= session2.startSession &&
            session1.dayOfWeek === session2.dayOfWeek
          ) {
            const conflictStartDate = Math.max(
              session1.startDate,
              session2.startDate
            ); // Ngày bắt đầu trùng
            const conflictEndDate = Math.min(
              session1.endDate,
              session2.endDate
            ); // Ngày kết thúc trùng

            const conflictStartSession = Math.max(
              session1.startSession,
              session2.startSession
            ); // Tiết bắt đầu trùng
            const conflictEndSession = Math.min(
              session1.endSession,
              session2.endSession
            ); // Tiết kết thúc trùng

            overlap +=
              countSpecificDayOfWeek(
                conflictStartDate,
                conflictEndDate,
                session1.dayOfWeek
              ) *
              (conflictEndSession - conflictStartSession + 1);
          }
        }
      }
    }

  return overlap;
}

export function getOverlapRange(
  range1: [number, number],
  range2: [number, number]
): [number, number] | null {
  const [start1, end1] = range1;
  const [start2, end2] = range2;

  // Check if the ranges overlap
  if (start1 <= end2 && start2 <= end1) {
    // Calculate the overlapping range
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    return [overlapStart, overlapEnd];
  }

  // No overlap
  return null;
}

export function calculateTotalSessionsInSessionRangeOfCombination(
  combination: CalendarGroupByClassDetail[],
  startShiftSession: number,
  endShiftSession: number
): number {
  return combination.reduce((acc, classData) => {
    for (const sessionData of classData.details) {
      const overlapMorningSessionRange = getOverlapRange(
        [sessionData.startSession, sessionData.endSession],
        [startShiftSession, endShiftSession]
      );
      acc +=
        (overlapMorningSessionRange
          ? overlapMorningSessionRange[1] - overlapMorningSessionRange[0] + 1
          : 0) *
        countSpecificDayOfWeek(
          sessionData.startDate,
          sessionData.endDate,
          sessionData.dayOfWeek
        );
    }
    return acc;
  }, 0);
}
