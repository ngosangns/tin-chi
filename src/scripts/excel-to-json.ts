import fs from 'fs';
import { WorkSheet, utils, readFile } from 'xlsx';
import {
  CellData,
  ClassData,
  Field,
  JSONData,
  JSONResultData,
} from '../types/excel';
import { SHEET_DATA, TITLE } from '../configs/excel';

const EXCEL_PATH = './public/tinchi.xlsx';
const JSON_PATH = './public/tinchi.json';

// Đọc sheet và xử lý các ô gộp
function readSheetAndUnmerge(filePath: string, sheetName: string): WorkSheet {
  // Đọc file Excel
  const workbook = readFile(filePath);

  // Chọn worksheet
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" không tìm thấy.`);
  }

  // Xử lý các ô gộp
  const mergedCells = worksheet['!merges'] || [];
  mergedCells.forEach((merge) => {
    const startCell = utils.encode_cell(merge.s); // Ô bắt đầu
    // const endCell = utils.encode_cell(merge.e); // Ô kết thúc
    const value = worksheet[startCell]?.v || ''; // Lấy giá trị từ ô bắt đầu

    // Điền tất cả các ô trong phạm vi gộp với cùng giá trị
    for (let row = merge.s.r; row <= merge.e.r; row++) {
      for (let col = merge.s.c; col <= merge.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: row, c: col });
        worksheet[cellAddress] = { v: value, t: 's' }; // Điền giá trị
      }
    }
  });

  return worksheet;
}

// Đọc cột Excel và chuyển đổi thành JSON
function readExcelColumnToJson(
  workSheet: WorkSheet,
  column: string,
  startRow: number,
  endRow: number
): string[] {
  // Chọn phạm vi cụ thể
  const rangeData = utils.sheet_to_json<CellData>(workSheet, {
    range: `${column}${startRow}:${column}${endRow}`,
  });

  return rangeData
    .map((row: CellData) => Object.values(row) as string[])
    .flat();
}

function main() {
  const jsonData: JSONData = {};

  // Lặp qua các sheet trong SHEET_DATA
  for (const sheetName of Object.keys(SHEET_DATA)) {
    const sheetData = SHEET_DATA[sheetName];
    const workSheet = readSheetAndUnmerge(EXCEL_PATH, sheetName);

    // Khởi tạo dữ liệu JSON cho sheet
    jsonData[sheetName] = {
      fieldData: {
        [Field.Class]: [] as string[],
        [Field.DayOfWeek]: [] as string[],
        [Field.Session]: [] as string[],
        [Field.StartDate]: [] as string[],
        [Field.EndDate]: [] as string[],
        [Field.Teacher]: [] as string[],
      },
    };

    const jsonSheetData = jsonData[sheetName];
    const { startRow, endRow } = sheetData;

    const fields: [
      Field.Class,
      Field.DayOfWeek,
      Field.Session,
      Field.StartDate,
      Field.EndDate,
      Field.Teacher
    ] = [
      Field.Class,
      Field.DayOfWeek,
      Field.Session,
      Field.StartDate,
      Field.EndDate,
      Field.Teacher,
    ];

    // Đọc dữ liệu từ các cột và lưu vào JSON
    for (const field of fields)
      jsonSheetData.fieldData[field] = readExcelColumnToJson(
        workSheet,
        sheetData.fieldColumn[field],
        startRow,
        endRow
      );
  }

  // Khởi tạo dữ liệu kết quả JSON
  const jsonResultData: JSONResultData = {
    title: TITLE,
    minDate: Infinity,
    maxDate: 0,
    majors: {},
  };

  // Lặp qua các sheet trong jsonData
  for (const sheetName of Object.keys(jsonData)) {
    const { fieldData } = jsonData[sheetName];

    // Lặp qua các lớp học trong fieldData
    for (let i = 0; i < fieldData[Field.Class].length; i++) {
      // Lấy tên lớp học
      const classTitle = fieldData[Field.Class][i];

      // Lấy tên môn học
      const subjectName = classTitle.replace(/\(([^()]+?)\)$/, '').trim();

      // Lấy mã lớp học kèm mã lớp thực hành (nếu có)
      const classCodeWithPracticeClassCode = /\(([^()]+?)\)$/.test(classTitle)
        ? classTitle.match(/\(([^()]+?)\)$/)?.[1] || ''
        : '';

      // Lấy mã lớp học
      const classCode = classCodeWithPracticeClassCode.includes('.')
        ? classCodeWithPracticeClassCode.split('.')[0]
        : classCodeWithPracticeClassCode;

      // Lấy mã lớp thực hành
      const practiceClassCode = classCodeWithPracticeClassCode.includes('.')
        ? classCodeWithPracticeClassCode.split('.')[1]
        : '';

      // Lấy ra tên khóa
      const majorKeys: string[] = classCode.includes('-')
        ? (() => {
            const matches = classCode.split('-')[0].matchAll(/[A-Z]+[0-9]+/g);
            return Array.from(matches, (match) => match[0]);
          })()
        : [];

      // Kiểm tra xem dữ liệu của lớp học đã tồn tại chưa
      const isClassDataExist =
        jsonResultData.majors?.[majorKeys[0]]?.[subjectName]?.[classCode];

      // Lấy dữ liệu của lớp học hiện tại hoặc tạo mới nếu chưa tồn tại
      const classData = isClassDataExist
        ? jsonResultData.majors[majorKeys[0]][subjectName][classCode]
        : ({
            schedules: [],
            [Field.Teacher]: fieldData[Field.Teacher][i] ?? '',
          } as ClassData);

      // Lấy dữ liệu của lớp học hiện tại để thêm thông tin vào
      let schedules = classData.schedules;

      // Lớp học hiện tại là lớp thực hành thì gán schedules là mảng của lớp thực hành
      if (practiceClassCode.length) {
        if (!classData.practiceSchedules) classData.practiceSchedules = {};
        if (!classData.practiceSchedules[practiceClassCode])
          classData.practiceSchedules[practiceClassCode] = [];

        schedules = classData.practiceSchedules[practiceClassCode];
      }

      // Lấy ra ngày bắt đầu và kết thúc
      const currentStartDate = Number(
        fieldData[Field.StartDate][i].split('/').reverse().join('')
      );
      const currentEndDate = Number(
        fieldData[Field.EndDate][i].split('/').reverse().join('')
      );

      // Cập nhật ngày nhỏ nhất và lớn nhất
      if (currentStartDate < jsonResultData.minDate)
        jsonResultData.minDate = currentStartDate;
      if (currentEndDate > jsonResultData.maxDate)
        jsonResultData.maxDate = currentEndDate;

      const session = fieldData[Field.Session][i].split('->').map(Number);
      const startSession = session[0]; // tiết bắt đầu của lịch học
      const endSession = session[1]; // tiết kết thúc của lịch học

      // thứ trong tuần của lịch học
      const dayOfWeek = parseInt(
        fieldData[Field.DayOfWeek][i] === 'CN'
          ? '8'
          : fieldData[Field.DayOfWeek][i]
      );
      const dayOfWeekStandard = dayOfWeek - 1 === 7 ? 0 : dayOfWeek - 1; // chuyển đổi thứ trong tuần từ 2-8 sang 0-6 (0: Chủ nhật)

      schedules.push({
        [Field.StartDate]: currentStartDate,
        [Field.EndDate]: currentEndDate,
        [Field.DayOfWeekStandard]: dayOfWeekStandard,
        [Field.StartSession]: startSession,
        [Field.EndSession]: endSession,
      });

      // Cập nhật dữ liệu vào lại kho chính
      for (const majorKey of majorKeys) {
        if (!jsonResultData.majors[majorKey])
          jsonResultData.majors[majorKey] = {};

        if (!jsonResultData.majors[majorKey][subjectName])
          jsonResultData.majors[majorKey][subjectName] = {};

        jsonResultData.majors[majorKey][subjectName][classCode] = classData;
      }
    }
  }

  // Gộp lịch thực hành vào lịch lý thuyết
  for (const majorKey in jsonResultData.majors) {
    const majorData = jsonResultData.majors[majorKey];

    for (const subjectKey in majorData) {
      const subjectData = majorData[subjectKey];

      for (const classKey in subjectData) {
        const classData = subjectData[classKey];

        // Nếu lớp học có lịch thực hành thì gộp lịch lý thuyết + thực hành thành một lớp mới của môn học
        if (
          classData.practiceSchedules &&
          Object.keys(classData.practiceSchedules).length
        ) {
          for (const practiceClassKey in classData.practiceSchedules)
            subjectData[`${classKey}.${practiceClassKey}`] = {
              schedules: [
                ...classData.schedules,
                ...classData.practiceSchedules[practiceClassKey],
              ],
              [Field.Teacher]: classData[Field.Teacher],
            } as ClassData;

          // Xóa lớp học lý thuyết đi
          delete subjectData[classKey];
        }
      }
    }
  }

  // Ghi dữ liệu JSON vào file
  fs.writeFileSync(JSON_PATH, JSON.stringify(jsonResultData, null, 2), 'utf8');

  console.log('Ghi file thành công!');
}

main();
