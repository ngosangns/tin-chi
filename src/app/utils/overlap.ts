import {
  CalendarGroupBySession,
  CalendarGroupBySessionDetail,
} from '../types/calendar';

function calculateOverlap(
  item1: CalendarGroupBySessionDetail,
  item2: CalendarGroupBySessionDetail
): number {
  const xOverlap = Math.max(
    0,
    Math.min(item1.endDate, item2.endDate) -
      Math.max(item1.startDate, item2.startDate)
  );
  const yOverlap = Math.max(
    0,
    Math.min(item1.dayOfWeek, item2.dayOfWeek) -
      Math.max(item1.dayOfWeek, item2.dayOfWeek)
  );
  const zOverlap = Math.max(
    0,
    Math.min(item1.endSession, item2.endSession) -
      Math.max(item1.startSession, item2.startSession)
  );
  return xOverlap * yOverlap * zOverlap; // Tổng thể tích vùng chồng lấp
}

function calculateTotalOverlap(
  selectedItems: CalendarGroupBySessionDetail[]
): number {
  let totalOverlap = 0;
  for (let i = 0; i < selectedItems.length; i++) {
    for (let j = i + 1; j < selectedItems.length; j++) {
      totalOverlap += calculateOverlap(selectedItems[i], selectedItems[j]);
    }
  }
  return totalOverlap;
}

function findMinimumOverlap(
  groups: CalendarGroupBySession[]
): CalendarGroupBySessionDetail[] {
  let minOverlap = Infinity;
  let bestCombination: CalendarGroupBySessionDetail[] = [];

  function backtrack(
    currentIndex: number,
    selectedItems: CalendarGroupBySessionDetail[]
  ) {
    if (currentIndex === groups.length) {
      const totalOverlap = calculateTotalOverlap(selectedItems);
      if (totalOverlap < minOverlap) {
        minOverlap = totalOverlap;
        bestCombination = [...selectedItems];
      }
      return;
    }

    for (const item of groups[currentIndex]) {
      selectedItems.push(item);
      backtrack(currentIndex + 1, selectedItems);
      selectedItems.pop();
    }
  }

  backtrack(0, []);
  return bestCombination;
}

// Example Usage
const groups: CalendarGroupBySession[] = [];

const result = findMinimumOverlap(groups);
// console.log('Best Combination with Minimum Overlap:', result);
