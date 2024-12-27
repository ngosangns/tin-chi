import {
  CalendarGroupByClassDetail,
  CalendarTableContent,
  ClassCombination,
} from '../types/calendar';
import { countSpecificDayOfWeek } from './date';

function calculateConflictsOptimized(
  combination: CalendarGroupByClassDetail[]
): number {
  const timeGrid: Map<number, Map<number, string[]>> = new Map(); // { dayOfWeek -> { period -> classIds[] } }
  let conflicts = 0;

  for (const cls of combination) {
    for (const schedule of cls.details) {
      const day = schedule.dayOfWeek;

      if (!timeGrid.has(day)) timeGrid.set(day, new Map());
      const periods = timeGrid.get(day)!;

      // Đánh dấu các tiết học
      for (
        let period = schedule.startSession;
        period <= schedule.endSession;
        period++
      ) {
        if (!periods.has(period)) periods.set(period, []);

        const classesAtPeriod = periods.get(period)!;
        if (classesAtPeriod.length > 0) {
          // Nếu đã có lớp trong thời gian này, tăng số lượng xung đột
          conflicts += classesAtPeriod.length;
        }
        classesAtPeriod.push(cls.subjectClassCode);
      }
    }
  }

  return conflicts;
}

/**
 * Tính toán số lượng tiết học bị trùng lặp giữa các lớp học
 *
 * @param {CalendarGroupByClassDetail[]} combination - Mảng các chi tiết lớp học được nhóm lại.
 * @returns {number} - Số lượng tiết học bị trùng lặp.
 *
 */
export function calculateOverlap(
  combination: CalendarGroupByClassDetail[],
  cache?: {
    [key: string]: number;
  }
): number {
  let overlap = 0;
  const aDateInMiliseconds = 24 * 60 * 60 * 1000;
  const cacheKeyPrefix = 'overlap';
  const timeGrid = new Map<number, Map<number, number>>(); // { date -> { period -> totalClasses } }

  // Lặp qua từng lớp
  for (let classIndex = 0; classIndex < combination.length; classIndex++) {
    const cls = combination[classIndex];
    const cacheKey = [
      cacheKeyPrefix,
      combination
        .slice(0, classIndex + 1)
        .map((c) => [c.majors[0], c.subjectName, c.subjectClassCode].join('-')),
    ].join('|');

    // Kiểm tra nếu có cache thì lấy
    if (cache && cache.hasOwnProperty(cacheKey)) {
      overlap += cache[cacheKey];
      continue;
    }

    // Lặp qua từng lịch học của lớp
    for (const schedule of cls.details) {
      // Lặp qua từng ngày trong lịch học
      for (
        let curDate = schedule.startDate;
        curDate <= schedule.endDate;
        curDate += aDateInMiliseconds
      ) {
        if (new Date(curDate).getDay() !== schedule.dayOfWeek) continue; // Nếu ngày hiện tại không nằm trong lịch học, bỏ qua
        if (!timeGrid.has(curDate)) timeGrid.set(curDate, new Map());
        const curDateTimeGrid = timeGrid.get(curDate)!;

        // Lặp qua từng tiết học trong lịch học
        for (
          let period = schedule.startSession;
          period <= schedule.endSession;
          period++
        ) {
          const classesAtPeriod = (curDateTimeGrid!.get(period) || 0) + 1;
          curDateTimeGrid.set(period, classesAtPeriod);
          if (classesAtPeriod > 1) overlap++;
        }
      }
    }

    // Lưu cache
    if (cache) cache[cacheKey] = overlap;
  }

  return overlap;
}

export function calculateOverlapWithBitmask(
  combination: CalendarGroupByClassDetail[],
  cache?: {
    [key: string]: number;
  }
): number {
  let overlap = 0;
  const aDayInMiliseconds = 24 * 60 * 60 * 1000;
  const cacheKeyPrefix = 'overlap';
  const timeGrid = new Map<number, number>(); // { date -> session list in bitmask }
  const maxSession = 16; // Giả định ta có 16 tiết học trong một ngày

  // Lặp qua từng lớp
  for (let classIndex = 0; classIndex < combination.length; classIndex++) {
    const cls = combination[classIndex];
    const cacheKey = [
      cacheKeyPrefix,
      combination
        .slice(0, classIndex + 1)
        .map((c) => [c.majors[0], c.subjectName, c.subjectClassCode].join('-')),
    ].join('|'); // Tạo cache key, dùng để lưu số lượng tiết học bị trùng lặp của tổ hợp lớp từ đầu đến lớp hiện tại

    // Kiểm tra nếu có cache thì lấy
    if (cache && cache.hasOwnProperty(cacheKey)) {
      overlap += cache[cacheKey];
      continue;
    }

    // Lặp qua từng lịch học của lớp
    for (const schedule of cls.details) {
      let isFoundDayOfWeek = false; // Đánh dấu xem đã tìm thấy ngày trong lịch học chưa
      // Lặp qua từng ngày trong lịch học
      for (
        let curDate = schedule.startDate;
        curDate <= schedule.endDate;
        curDate += isFoundDayOfWeek ? aDayInMiliseconds * 7 : aDayInMiliseconds // Nếu đã tìm thấy ngày trong lịch học, thì nhảy 7 ngày thay vì 1 ngày
      ) {
        if(!isFoundDayOfWeek) {
          if (new Date(curDate).getDay() !== schedule.dayOfWeek) continue; // Nếu ngày hiện tại không nằm trong lịch học, bỏ qua
          else isFoundDayOfWeek = true; // Đánh dấu đã tìm thấy ngày trong lịch học
        }

        const curDateBitmask = timeGrid.get(curDate) || 0; // Lấy lịch bitmask của ngày hiện tại

        const curClassBitmask =
          ((1 << (schedule.endSession - schedule.startSession + 1)) - 1) <<
          (maxSession - schedule.endSession); // Tạo lịch bitmask của lớp trong ngày hiện tại

        timeGrid.set(curDate, curDateBitmask | curClassBitmask); // Gộp lịch bitmask của lớp vào lịch bitmask của ngày hiện tại

        // Đến số lượng tiết bị trùng (dùng cache nếu có)
        const totalOverlapSessions = (() => {
          let overlapBitmask = curClassBitmask & curDateBitmask; // Tạo lịch bitmask của các tiết bị trùng
          if (overlapBitmask === 0) return 0; // Nếu không có tiết bị trùng thì trả về 0

          // Kiểm tra nếu có cache thì lấy
          const cacheKey = 'tb1|' + overlapBitmask;
          if (cache && cache[cacheKey]) return cache[cacheKey];

          // Đếm số bit "1" trong overlapBitmask (tương ứng với số tiết bị trùng)
          let count = 0;
          while (overlapBitmask > 0) {
            count += overlapBitmask & 1;
            overlapBitmask >>= 1;
          }

          // Lưu cache
          cache && (cache[cacheKey] = count);

          return count;
        })();

        overlap += totalOverlapSessions;
      }
    }

    // Lưu cache
    if (cache) cache[cacheKey] = overlap;
  }

  return overlap;
}


export function calculateOverlapWithBitmask2(
  combination: ClassCombination,
  minDate: number,
  maxDate: number,
  totalSession: number,
): number {
  let overlap = 0;
  const aDayInMiliseconds = 24 * 60 * 60 * 1000;
  const totalDate = (maxDate - minDate) / aDayInMiliseconds + 1;
  const timeGrid = Array(totalDate).fill(0)

  const getDateIndex = (date: number) => (date - minDate) / aDayInMiliseconds;

  // Lặp qua từng lớp
  for (let classIndex = 0; classIndex < combination.length; classIndex++) {
    const classData = combination[classIndex];
    for(let scheduleIndex = 0; scheduleIndex < classData.details.length; scheduleIndex++) {
      let isFoundDayOfWeek = false; // Đánh dấu xem đã tìm thấy ngày trong lịch học chưa

      const scheduleData = classData.details[scheduleIndex];

      // Lặp qua từng ngày trong lịch học
      for (
        let curDate = scheduleData.startDate;
        curDate <= scheduleData.endDate;
        curDate += isFoundDayOfWeek ? aDayInMiliseconds * 7 : aDayInMiliseconds // Nếu đã tìm thấy ngày trong lịch học, thì nhảy 7 ngày thay vì 1 ngày
      ) {
        if(!isFoundDayOfWeek) {
          const curDayOfWeek = (Math.floor(curDate / 86400) + 4) % 7
          if (curDayOfWeek !== scheduleData.dayOfWeek) continue; // Nếu ngày hiện tại không nằm trong lịch học, bỏ qua
          else isFoundDayOfWeek = true; // Đánh dấu đã tìm thấy ngày trong lịch học
        }

        const curDateBitmask = timeGrid[getDateIndex(curDate)]; // Lấy lịch bitmask của ngày hiện tại
        const curClassBitmask = ((1 << (scheduleData.endSession - scheduleData.startSession + 1)) - 1) << (totalSession - scheduleData.endSession); // Tạo lịch bitmask của lớp trong ngày hiện tại

        timeGrid[getDateIndex(curDate)] = curDateBitmask | curClassBitmask // Gộp lịch bitmask của lớp vào lịch bitmask của ngày hiện tại

        // Đến số lượng tiết bị trùng (dùng cache nếu có)
        const totalOverlapSessions = (() => {
          let overlapBitmask = curClassBitmask & curDateBitmask; // Tạo lịch bitmask của các tiết bị trùng
          if (overlapBitmask === 0) return 0; // Nếu không có tiết bị trùng thì trả về 0

          // Đếm số bit "1" trong overlapBitmask (tương ứng với số tiết bị trùng)
          let count = 0;
          while (overlapBitmask > 0) {
            count += overlapBitmask & 1;
            overlapBitmask >>= 1;
          }

          return count;
        })();

        overlap += totalOverlapSessions;
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

export function calculateTotalSessionsInSessionRange(
  combination: CalendarGroupByClassDetail[],
  startShiftSession: number,
  endShiftSession: number,
  cache?: {
    [key: string]: number;
  }
): number {
  const cacheKeyPrefix = `totalSessionsInSessionRange-${startShiftSession}-${endShiftSession}`;
  const combinationCacheKey = [
    cacheKeyPrefix,
    ...combination.map((cd) =>
      [cd.majors[0], cd.subjectName, cd.subjectClassCode].join('-')
    ),
  ].join('|');

  if (cache && cache.hasOwnProperty(combinationCacheKey))
    return cache[combinationCacheKey];

  const result = combination.reduce((acc, classData) => {
    const cacheKey = [
      cacheKeyPrefix,
      classData.majors[0],
      classData.subjectName,
      classData.subjectClassCode,
    ].join('|');

    if (cache && cache.hasOwnProperty(cacheKey)) acc += cache[cacheKey];
    else {
      let localAcc = 0;
      for (const sessionData of classData.details) {
        const overlapRange = getOverlapRange(
          [sessionData.startSession, sessionData.endSession],
          [startShiftSession, endShiftSession]
        );
        localAcc +=
          (overlapRange ? overlapRange[1] - overlapRange[0] + 1 : 0) *
          countSpecificDayOfWeek(
            sessionData.startDate,
            sessionData.endDate,
            sessionData.dayOfWeek
          );
      }

      cache && (cache[cacheKey] = localAcc);
      acc += localAcc;
    }

    return acc;
  }, 0);

  cache && (cache[combinationCacheKey] = result);

  return result;
}


// Hàm đếm bit 1 trong một số nguyên
export function countBit1(n: number): number {
  let count = 0;
  while (n > 0) {
    count += n & 1; // Nếu bit cuối là 1, tăng count
    n >>= 1;        // Dịch phải để kiểm tra bit tiếp theo
  }
  return count;
}

export const aDayInMiliseconds = 24 * 60 * 60 * 1000;

  // Hàm tính overlap giữa 2 lớp
export function calculateOverlapBetween2Classes(
  c1: [number, number, number, number][], // [startDate, endDate, dayOfWeek, sessionBitmask][]
  c2: [number, number, number, number][]
): number {
  if(c1.length === 0 || c2.length === 0) return 0;

  // Kiểm tra nếu khoảng thời gian của hai lớp không giao nhau thì trả về 0
  if(c1[c1.length - 1][1] < c2[0][0] || c2[c2.length - 1][1] < c1[0][0]) return 0;

  let overlap = 0;

  for(let i =0 ; i < c1.length; i++)
    for(let j = 0; j < c2.length; j++)
      // Kiểm tra nếu khoảng thời gian của hai lớp có giao nhau và cùng ngày học trong tuần
      if (c1[i][0] <= c2[j][1] && c1[i][1] >= c2[j][0] && c1[i][2] === c2[j][2]) {
        // Tính toán overlap bằng cách sử dụng bitmask
        const _overlap = c1[i][3] & c2[j][3];
        // Tính tổng số tuần mà hai lớp học chung
        const totalWeeks = (Math.min(c1[i][1], c2[j][1]) - Math.max(c1[i][0], c2[j][0]) + aDayInMiliseconds) / (aDayInMiliseconds * 7);
        // Nếu có overlap, đếm số bit 1 trong bitmask và cộng vào tổng overlap
        if (_overlap > 0) overlap += countBit1(_overlap) * totalWeeks;
      }

  return overlap;
}
