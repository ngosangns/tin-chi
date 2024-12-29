import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  take,
} from 'rxjs';
import {
  END_AFTERNOON_SESSION,
  END_EVENING_SESSION,
  END_MORNING_SESSION,
  JSON_PATH,
  MAX_SESSION,
  MIN_SESSION,
  START_AFTERNOON_SESSION,
  START_EVENING_SESSION,
  START_MORNING_SESSION,
} from '../../constants/calendar';
import { AutoMode } from '../../types/calendar';
import { Field, JSONResultData } from '../../types/excel';
import { getTotalDaysBetweenDates, numToDate } from '../../utils/date';
import { MajorSelectedSubjects } from './app-calendar.component';
import { toData, WebWorker } from '@ng-web-apis/workers';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  readonly calendar$ = new BehaviorSubject<JSONResultData>({
    title: '',
    minDate: 0,
    maxDate: 0,
    majors: {},
  });

  readonly selectedClasses$ = new BehaviorSubject<MajorSelectedSubjects>({});

  autoTh$ = new BehaviorSubject<number>(-1); // Thứ tự của kết quả cần lấy, dùng trong trường hợp tự động xếp lịch và muốn lấy kết quả khác với kết quả đầu tiên
  oldAuto$ = new BehaviorSubject<AutoMode | null>(null); // Kiểu tự động xếp lịch

  readonly calendarTableData$ = combineLatest({
    calendar: this.calendar$,
    selectedClasses: this.selectedClasses$,
  }).pipe(
    map(({ calendar, selectedClasses }) => {
      const minDate = numToDate(calendar.minDate);
      const maxDate = numToDate(calendar.maxDate);
      const totalDays = getTotalDaysBetweenDates(minDate, maxDate);

      const calendarTableData: {
        startSession: number;
        endSession: number;
        subjectName: string;
        classCode: string;
      }[][][] = new Array(totalDays + 1).fill(null).map(() => []);

      let totalConflictedSessions = 0;

      for (const majorKey of Object.keys(selectedClasses))
        for (const subjectName of Object.keys(selectedClasses[majorKey])) {
          const selectedSubjectData = selectedClasses[majorKey][subjectName];
          if (!selectedSubjectData.show || !selectedSubjectData.class) continue;

          const classData =
            calendar.majors[majorKey][subjectName][selectedSubjectData.class];

          for (const schedule of classData.schedules) {
            let isMeetRightDayOfWeek = false;

            const startDate = numToDate(schedule[Field.StartDate]);
            const endDate = numToDate(schedule[Field.EndDate]);

            for (
              const date = new Date(startDate);
              date <= endDate;
              date.setDate(date.getDate() + (isMeetRightDayOfWeek ? 7 : 1))
            ) {
              if (date.getDay() === schedule[Field.DayOfWeekStandard])
                isMeetRightDayOfWeek = true;
              else continue;

              const dateTableData =
                calendarTableData[getTotalDaysBetweenDates(minDate, date)];

              let isAdded = false;

              for (const row of dateTableData) {
                let isConflicted = false;

                for (const item of row)
                  if (
                    item.startSession <= schedule[Field.EndSession] &&
                    item.endSession >= schedule[Field.StartSession]
                  ) {
                    isConflicted = true;
                    totalConflictedSessions +=
                      Math.min(item.endSession, schedule[Field.EndSession]) -
                      Math.max(
                        item.startSession,
                        schedule[Field.StartSession]
                      ) +
                      1;
                    break;
                  }

                if (isConflicted) continue;

                row.push({
                  startSession: schedule[Field.StartSession],
                  endSession: schedule[Field.EndSession],
                  subjectName,
                  classCode: selectedSubjectData.class,
                });
                isAdded = true;
                break;
              }

              if (!isAdded)
                dateTableData.push([
                  {
                    startSession: schedule[Field.StartSession],
                    endSession: schedule[Field.EndSession],
                    subjectName,
                    classCode: selectedSubjectData.class,
                  },
                ]);
            }
          }
        }

      return {
        data: calendarTableData,
        totalConflictedSessions,
      };
    })
  );

  private readonly calendarWorker = WebWorker.fromFunction<
    {
      calendar: JSONResultData;
      selectedSubjects: [string, string][]; // Danh sách các môn học được chọn: [majorKey, subjectKey][]
      auto: AutoMode;
      autoTh: number;
      deps: GenerateCombinationOfSubjectsDependencies;
    },
    {
      selectedClasses: [string, string, string][];
    }
  >(generateCombinationOfSubjects);

  async fetchData(): Promise<void> {
    const response: Response = await fetch(JSON_PATH);
    const jsonResponse: JSONResultData = await response.json();
    if (!jsonResponse) throw new Error('Không có dữ liệu');
    this.calendar$.next(jsonResponse);
  }

  async generateCombinationOfSubjects(auto: AutoMode): Promise<void> {
    if (auto !== this.oldAuto$.value) this.autoTh$.next(0);
    else this.autoTh$.next(this.autoTh$.value + 1);

    this.oldAuto$.next(auto);

    this.calendarWorker.postMessage({
      calendar: this.calendar$.value,
      selectedSubjects: Object.entries(this.selectedClasses$.value).flatMap(
        ([majorKey, majorData]) =>
          Object.entries(majorData)
            .filter((subject) => subject[1].show)
            .map((subject) => [majorKey, subject[0]])
      ) as [string, string][],
      auto,
      autoTh: this.autoTh$.value,
      deps: {
        START_MORNING_SESSION,
        END_MORNING_SESSION,
        START_AFTERNOON_SESSION,
        END_AFTERNOON_SESSION,
        START_EVENING_SESSION,
        END_EVENING_SESSION,
        Field,
        MIN_SESSION,
        MAX_SESSION,
      },
    });

    const data = await firstValueFrom(
      this.calendarWorker.pipe(toData(), take(1))
    );

    const selectedClasses = this.selectedClasses$.value;

    for (const [majorKey, subjectName, classCode] of data.selectedClasses) {
      if (!selectedClasses[majorKey]) selectedClasses[majorKey] = {};
      selectedClasses[majorKey][subjectName] = {
        show: true,
        class: classCode,
      };
    }

    this.selectedClasses$.next(selectedClasses);
  }

  selectMajor(e: { major: string; select: boolean }): void {
    const allSubjectNamesOfMajor = Object.keys(
      this.calendar$.value.majors[e.major]
    );

    const selectedClasses = this.selectedClasses$.value;

    if (!selectedClasses[e.major]) selectedClasses[e.major] = {};

    for (const subjectName of allSubjectNamesOfMajor)
      if (!selectedClasses[e.major][subjectName])
        selectedClasses[e.major][subjectName] = {
          show: e.select,
          class: null,
        };
      else selectedClasses[e.major][subjectName].show = e.select;

    this.selectedClasses$.next(selectedClasses);
    this.autoTh$.next(-1);
  }

  changeClass(e: {
    majorKey: string;
    subjectName: string;
    classCode: string | null;
  }): void {
    const selectedClasses = this.selectedClasses$.value;
    if (!selectedClasses[e.majorKey]) selectedClasses[e.majorKey] = {};
    if (!selectedClasses[e.majorKey][e.subjectName])
      selectedClasses[e.majorKey][e.subjectName] = {
        show: false,
        class: e.classCode,
      };
    else selectedClasses[e.majorKey][e.subjectName].class = e.classCode;
    this.selectedClasses$.next(selectedClasses);
  }

  changeShow(e: {
    majorKey: string;
    subjectName: string;
    show: boolean;
  }): void {
    const selectedClass = this.selectedClasses$.value;
    if (!selectedClass[e.majorKey]) selectedClass[e.majorKey] = {};
    if (!selectedClass[e.majorKey][e.subjectName])
      selectedClass[e.majorKey][e.subjectName] = {
        show: e.show,
        class: null,
      };
    else selectedClass[e.majorKey][e.subjectName].show = e.show;
    this.selectedClasses$.next(selectedClass);
    this.autoTh$.next(-1);
  }
}

type GenerateCombinationOfSubjectsDependencies = {
  START_MORNING_SESSION: number;
  END_MORNING_SESSION: number;
  START_AFTERNOON_SESSION: number;
  END_AFTERNOON_SESSION: number;
  START_EVENING_SESSION: number;
  END_EVENING_SESSION: number;
  Field: typeof Field;
  MIN_SESSION: number;
  MAX_SESSION: number;
};

// Tìm ra tổ hợp các lớp từ các môn được chọn sao cho độ trùng lặp thời gian học là ít nhất
async function generateCombinationOfSubjects(e: {
  calendar: JSONResultData;
  selectedSubjects: [string, string][]; // Danh sách các môn học được chọn: [majorKey, subjectKey][]
  auto: AutoMode;
  autoTh: number;
  deps: GenerateCombinationOfSubjectsDependencies;
}): Promise<{
  selectedClasses: [string, string, string][];
}> {
  const {
    calendar,
    selectedSubjects,
    auto,
    autoTh,
    deps: {
      START_MORNING_SESSION,
      END_MORNING_SESSION,
      START_AFTERNOON_SESSION,
      END_AFTERNOON_SESSION,
      START_EVENING_SESSION,
      END_EVENING_SESSION,
      Field,
      MIN_SESSION,
      MAX_SESSION,
    },
  } = e;

  // n = số môn
  // m = số lớp của mỗi môn
  // p = số lịch của mỗi lớp
  const classes: [string, string, string][][] = []; // Danh sách các lớp của các môn: n * m * [majorKey, subjectKey, classCode]
  const timeGrid: [number, number, number, number][][][] = []; // Lịch học của các lớp của các môn: n * m * p * [startDate, endDate, dayOfWeek, sessionBitmask]
  const totalSessionsInShift: number[][] = []; // Tổng số tiết học trong buổi auto của các lớp của các môn: n * m

  const autoData = [
    ['refer-non-overlap-morning', START_MORNING_SESSION, END_MORNING_SESSION],
    [
      'refer-non-overlap-afternoon',
      START_AFTERNOON_SESSION,
      END_AFTERNOON_SESSION,
    ],
    ['refer-non-overlap-evening', START_EVENING_SESSION, END_EVENING_SESSION],
  ].find((item) => item[0] === auto) as [string, number, number];

  const aDayInMiliseconds = 24 * 60 * 60 * 1000;

  selectedSubjects.forEach(([majorKey, subjectKey]) => {
    const subjectData = calendar.majors[majorKey][subjectKey];
    const subjectClasses: [string, string, string][] = []; // Danh sách các lớp: n * [majorKey, subjectKey, classCode]
    const subjectTimeGrid: [number, number, number, number][][] = []; // Lịch học của tất cả các lớp: m * p * [startDate, endDate, dayOfWeek, sessionBitmask]
    const subjectTotalSessionsInShift: number[] = []; // Tổng số tiết học trong buổi auto của tất cả các lớp: m

    Object.entries(subjectData).forEach(([classCode, classData]) => {
      const classScheduleGrid: [number, number, number, number][] = []; // Lịch học của lớp: m * [startDate, endDate, dayOfWeek, sessionBitmask]

      let totalShiftSesion = 0;

      for (const schedule of classData.schedules) {
        // Lấy ra số tuần giữa ngày bắt đầu và ngày kết thúc
        const totalWeeks =
          (schedule[Field.EndDate] -
            schedule[Field.StartDate] +
            aDayInMiliseconds) /
          (aDayInMiliseconds * 7);

        const classScheduleGridAtI: [number, number, number, number] = [
          schedule[Field.StartDate],
          schedule[Field.EndDate],
          schedule[Field.DayOfWeekStandard],
          ((1 <<
            (schedule[Field.EndSession] - schedule[Field.StartSession] + 1)) -
            1) <<
            (MAX_SESSION - MIN_SESSION + 1 - schedule[Field.EndSession]), // Tạo lịch bitmask của lớp trong lịch hiện tại
        ];

        classScheduleGrid.push(classScheduleGridAtI); // Thêm lịch học của lớp vào lịch

        // Tính số tiết học trong buổi
        if (
          autoData &&
          schedule[Field.StartSession] <= autoData[2] &&
          schedule[Field.EndSession] >= autoData[1]
        )
          totalShiftSesion +=
            (Math.min(autoData[2], schedule[Field.EndSession]) -
              Math.max(autoData[1], schedule[Field.StartSession]) +
              1) *
            totalWeeks;
      }

      subjectTimeGrid.push(classScheduleGrid); // Thêm lịch học của lớp vào lịch môn
      subjectClasses.push([majorKey, subjectKey, classCode]); // Thêm lớp vào danh sách các lớp của môn
      subjectTotalSessionsInShift.push(totalShiftSesion); // Thêm tổng số tiết học của ca học của lớp trong môn học
    });

    classes.push(subjectClasses); // Thêm danh sách các lớp của môn học vào danh sách các lớp
    timeGrid.push(subjectTimeGrid); // Thêm lịch học của môn học vào lịch
    totalSessionsInShift.push(subjectTotalSessionsInShift); // Thêm tổng số tiết học trong mỗi buổi của các lớp trong môn học
  });

  const combinations: number[][] = []; // Danh sách các tổ hợp: Số lượng tổ hợp * (n + 1)
  const threshold = 12; // số tiết học có thể trùng tối đa trong 1 tổ hợp

  function countBit1(n: number): number {
    let count = 0;
    while (n > 0) {
      count += n & 1; // Nếu bit cuối là 1, tăng count
      n >>= 1; // Dịch phải để kiểm tra bit tiếp theo
    }
    return count;
  }

  // Hàm tính overlap giữa 2 lớp
  function calculateOverlapBetween2Classes(
    c1: [number, number, number, number][], // [startDate, endDate, dayOfWeek, sessionBitmask][]
    c2: [number, number, number, number][]
  ): number {
    if (c1.length === 0 || c2.length === 0) return 0;

    // Kiểm tra nếu khoảng thời gian của hai lớp không giao nhau thì trả về 0
    if (c1[c1.length - 1][1] < c2[0][0] || c2[c2.length - 1][1] < c1[0][0])
      return 0;

    let overlap = 0;

    // Kiểm tra nếu khoảng thời gian của hai lớp có giao nhau và cùng ngày học trong tuần
    for (const [startDate1, endDate1, dayOfWeek1, timeGrid1] of c1)
      for (const [startDate2, endDate2, dayOfWeek2, timeGrid2] of c2)
        if (
          startDate1 <= endDate2 &&
          endDate1 >= startDate2 &&
          dayOfWeek1 === dayOfWeek2
        ) {
          // Tính toán overlap bằng cách sử dụng bitmask
          const _overlap = timeGrid1 & timeGrid2;
          // Tính tổng số tuần mà hai lớp học chung
          const totalWeeks =
            (Math.min(endDate1, endDate2) -
              Math.max(startDate1, startDate2) +
              aDayInMiliseconds) /
            (aDayInMiliseconds * 7);
          // Nếu có overlap, đếm số bit 1 trong bitmask và cộng vào tổng overlap
          if (_overlap > 0) overlap += countBit1(_overlap) * totalWeeks;
        }

    return overlap;
  }

  // Hàm tạo tổ hợp
  function generateCombination(
    current: number[],
    index: number,
    overlap: number
  ) {
    // Nếu đã chọn hết tất cả các môn thì thêm tổ hợp này vào danh sách tổ hợp
    if (index === selectedSubjects.length) {
      combinations.push([overlap, ...current]);
      return;
    }

    const classesData = classes[index]; // Lấy danh sách các lớp của môn học hiện tại
    for (let i = 0; i < classesData.length; i++) {
      let newOverlap = overlap;

      const currentClassTimeGrid = timeGrid[index][i]; // Lấy lịch học của lớp hiện tại

      // Tính số tiết học bị trùng trong trường hợp thêm lớp này vào tổ hợp
      for (let j = 0; j < index; j++) {
        newOverlap += calculateOverlapBetween2Classes(
          timeGrid[j][current[j]],
          currentClassTimeGrid
        );

        // Nếu số tiết học bị trùng vượt quá ngưỡng thì bỏ qua tổ hợp này
        if (newOverlap > threshold) break;
      }

      // Nếu số tiết học bị trùng vượt quá ngưỡng thì bỏ qua tổ hợp này
      if (newOverlap > threshold) continue;

      current[index] = i; // Lưu lớp được chọn
      generateCombination(current, index + 1, newOverlap); // Tìm tổ hợp cho môn tiếp theo
    }
  }

  const start = performance.now();

  generateCombination(new Array(selectedSubjects.length).fill(0), 0, 0); // Phần tử đầu tiên trong mảng là tổng số tiết học bị trùng

  console.log('Generate combinations time:', performance.now() - start);
  console.log('Total combinations:', combinations.length);

  // Sắp xếp các tổ hợp theo thứ tự tăng dần của số tiết học bị trùng
  const combinationsWithOverlapSorted = combinations.sort((a, b) => {
    const diff = a[0] - b[0];
    if (diff !== 0 || !autoData) return diff;

    return (
      b
        .slice(1)
        .reduce((acc, cur, i) => acc + totalSessionsInShift[i][cur], 0) -
      a.slice(1).reduce((acc, cur, i) => acc + totalSessionsInShift[i][cur], 0)
    );
  });

  if (combinationsWithOverlapSorted.length) {
    // Tìm tổ hợp tối ưu nhất dựa trên số tiết học bị trùng
    const bestCombinationIndex = autoTh % combinationsWithOverlapSorted.length;

    const bestCombination =
      combinationsWithOverlapSorted[bestCombinationIndex].slice(1);

    return {
      selectedClasses: bestCombination.map(
        (classIndex, i) => classes[i][classIndex]
      ),
    };
  }

  return {
    selectedClasses: [],
  };
}
