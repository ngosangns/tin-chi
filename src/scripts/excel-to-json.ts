import fs from 'fs';
import { WorkSheet, utils, readFile } from 'xlsx';
import {
  CellData,
  ClassData,
  Field,
  JSONData,
  JSONResultData,
  MajorData,
  SubjectData,
} from '../types/excel';
import { SHEET_DATA, TITLE } from '../configs/excel';

const EXCEL_PATH = './public/tinchi.xlsx';
const JSON_PATH = './public/tinchi.json';

function readSheetAndUnmerge(filePath: string, sheetName: string): WorkSheet {
  // Read the Excel file
  const workbook = readFile(filePath);

  // Select the worksheet
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found.`);
  }

  // Handle merged cells
  const mergedCells = worksheet['!merges'] || [];
  mergedCells.forEach((merge) => {
    const startCell = utils.encode_cell(merge.s); // Start cell
    const endCell = utils.encode_cell(merge.e); // End cell
    const value = worksheet[startCell]?.v || ''; // Get value from start cell

    // Fill all cells in the merged range with the same value
    for (let row = merge.s.r; row <= merge.e.r; row++) {
      for (let col = merge.s.c; col <= merge.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: row, c: col });
        worksheet[cellAddress] = { v: value, t: 's' }; // Fill with value
      }
    }
  });

  return worksheet;
}

function readExcelColumnToJson(
  workSheet: WorkSheet,
  column: string,
  startRow: number,
  endRow: number
): string[] {
  // Select the specific range
  const rangeData = utils.sheet_to_json<CellData>(workSheet, {
    range: `${column}${startRow}:${column}${endRow}`,
  });

  return rangeData.map((row: CellData) => Object.values(row)).flat();
}

function main() {
  const jsonData: JSONData = {};

  for (const sheetName of Object.keys(SHEET_DATA)) {
    const sheetData = SHEET_DATA[sheetName];
    const workSheet = readSheetAndUnmerge(EXCEL_PATH, sheetName);

    // Initialize the JSON sheet data
    jsonData[sheetName] = {
      fieldData: {
        [Field.Class]: <string[]>[],
        [Field.DayOfWeek]: <string[]>[],
        [Field.Session]: <string[]>[],
        [Field.StartDate]: <string[]>[],
        [Field.EndDate]: <string[]>[],
        [Field.Teacher]: <string[]>[],
      },
    };

    const jsonSheetData = jsonData[sheetName];
    const { startRow, endRow } = sheetData;

    jsonSheetData.fieldData[Field.Class] = readExcelColumnToJson(
      workSheet,
      sheetData.fieldColumn[Field.Class],
      startRow,
      endRow
    );
    jsonSheetData.fieldData[Field.DayOfWeek] = readExcelColumnToJson(
      workSheet,
      sheetData.fieldColumn[Field.DayOfWeek],
      startRow,
      endRow
    );
    jsonSheetData.fieldData[Field.Session] = readExcelColumnToJson(
      workSheet,
      sheetData.fieldColumn[Field.Session],
      startRow,
      endRow
    );
    jsonSheetData.fieldData[Field.StartDate] = readExcelColumnToJson(
      workSheet,
      sheetData.fieldColumn[Field.StartDate],
      startRow,
      endRow
    );
    jsonSheetData.fieldData[Field.EndDate] = readExcelColumnToJson(
      workSheet,
      sheetData.fieldColumn[Field.EndDate],
      startRow,
      endRow
    );
    jsonSheetData.fieldData[Field.Teacher] = readExcelColumnToJson(
      workSheet,
      sheetData.fieldColumn[Field.Teacher],
      startRow,
      endRow
    );
  }

  // Write the JSON data to a file
  const jsonResultData: JSONResultData = {
    title: TITLE,
    minDate: Infinity,
    maxDate: 0,
    majors: {},
  };

  for (const sheetName of Object.keys(jsonData)) {
    const { fieldData } = jsonData[sheetName];
    const majorData: MajorData = {};

    for (let i = 0; i < fieldData[Field.Class].length; i++) {
      const classTitle = fieldData[Field.Class][i];

      const subjectName = /\((.+?)\)$/.test(classTitle)
        ? classTitle.replace(/\((.+?)\)$/, '').trim()
        : classTitle;

      const classCodeWithPracticeClassCode = /\((.+?)\)$/.test(classTitle)
        ? classTitle.match(/\((.+?)\)$/)?.[1] || ''
        : '';

      const classCode = classCodeWithPracticeClassCode.includes('.')
        ? classCodeWithPracticeClassCode.split('.')[0]
        : classCodeWithPracticeClassCode;

      const practiceClassCode = classCodeWithPracticeClassCode.includes('.')
        ? classCodeWithPracticeClassCode.split('.')[1]
        : '';

      if (!majorData[subjectName]) majorData[subjectName] = <SubjectData>{};

      if (!majorData[subjectName][classCode])
        majorData[subjectName][classCode] = <ClassData>{
          schedules: [],
          [Field.Teacher]: fieldData[Field.Teacher][i] ?? '',
        };

      const classData = majorData[subjectName][classCode];

      let schedules = classData.schedules;

      if (practiceClassCode.length) {
        if (!classData.practiceSchedules) classData.practiceSchedules = {};
        if (!classData.practiceSchedules[practiceClassCode])
          classData.practiceSchedules[practiceClassCode] = [];

        schedules = classData.practiceSchedules[practiceClassCode];
      }

      const currentStartDate = Number(
        fieldData[Field.StartDate][i].split('/').reverse().join('')
      );
      const currentEndDate = Number(
        fieldData[Field.EndDate][i].split('/').reverse().join('')
      );

      if (currentStartDate < jsonResultData.minDate)
        jsonResultData.minDate = currentStartDate;
      if (currentEndDate > jsonResultData.maxDate)
        jsonResultData.maxDate = currentEndDate;

      const session = fieldData[Field.Session][i].split('->').map(Number);
      const startSession = session[0];
      const endSession = session[1];

      const dayOfWeek = parseInt(
        fieldData[Field.DayOfWeek][i] === 'CN'
          ? '8'
          : fieldData[Field.DayOfWeek][i]
      );
      const dayOfWeekStandard = dayOfWeek - 1 === 7 ? 0 : dayOfWeek - 1;

      schedules.push({
        [Field.StartDate]: currentStartDate,
        [Field.EndDate]: currentEndDate,
        [Field.DayOfWeekStandard]: dayOfWeekStandard,
        [Field.StartSession]: startSession,
        [Field.EndSession]: endSession,
      });
    }

    jsonResultData.majors[sheetName] = majorData;
  }

  // Write the JSON data to a file
  fs.writeFileSync(JSON_PATH, JSON.stringify(jsonResultData, null, 2), 'utf8');

  console.log('File written successfully!');
}

main();
