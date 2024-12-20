import fs from 'fs';
import { WorkSheet, utils, readFile } from 'xlsx';
import {
  CellData,
  Field,
  JSONData,
  JSONResultData,
  SheetData,
} from '../types/excel';

// Cài đặt thông số cho file Excel
// Thực hiện mỗi khi cập nhật file Excel mới
const TITLE = 'Học kỳ 2 năm học 2023 - 2024';
const SHEET_DATA: SheetData = {
  CT4: {
    startRow: 5,
    endRow: 112,
    fieldColumn: {
      [Field.Class]: 'D',
      [Field.DayOfWeek]: 'G',
      [Field.Session]: 'H',
      [Field.StartDate]: 'J',
      [Field.EndDate]: 'K',
      [Field.Teacher]: 'L',
    },
  },
  AT17CT5DT4: {
    startRow: 5,
    endRow: 373,
    fieldColumn: {
      [Field.Class]: 'D',
      [Field.DayOfWeek]: 'G',
      [Field.Session]: 'H',
      [Field.StartDate]: 'J',
      [Field.EndDate]: 'K',
      [Field.Teacher]: 'L',
    },
  },
  AT18CT6DT5: {
    startRow: 5,
    endRow: 320,
    fieldColumn: {
      [Field.Class]: 'D',
      [Field.DayOfWeek]: 'G',
      [Field.Session]: 'H',
      [Field.StartDate]: 'J',
      [Field.EndDate]: 'K',
      [Field.Teacher]: 'L',
    },
  },
  AT19CT7DT6: {
    startRow: 5,
    endRow: 424,
    fieldColumn: {
      [Field.Class]: 'D',
      [Field.DayOfWeek]: 'G',
      [Field.Session]: 'H',
      [Field.StartDate]: 'J',
      [Field.EndDate]: 'K',
      [Field.Teacher]: 'L',
    },
  },
  AT20CT8DT7: {
    startRow: 5,
    endRow: 398,
    fieldColumn: {
      [Field.Class]: 'D',
      [Field.DayOfWeek]: 'G',
      [Field.Session]: 'H',
      [Field.StartDate]: 'J',
      [Field.EndDate]: 'K',
      [Field.Teacher]: 'L',
    },
  },
};
// ----------------------

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
        [Field.Class]: [],
        [Field.DayOfWeek]: [],
        [Field.Session]: [],
        [Field.StartDate]: [],
        [Field.EndDate]: [],
        [Field.Teacher]: [],
      },
    };

    const jsonSheetData = jsonData[sheetName];

    for (const field of Object.values(Field)) {
      const { startRow, endRow } = sheetData;
      jsonSheetData.fieldData[field] = readExcelColumnToJson(
        workSheet,
        sheetData.fieldColumn[field],
        startRow,
        endRow
      );
    }
  }

  // Write the JSON data to a file
  const jsonResultData: JSONResultData = {
    title: TITLE,
    data: [],
  };

  for (const sheetName of Object.keys(jsonData)) {
    const { fieldData } = jsonData[sheetName];

    for (let i = 0; i < fieldData[Field.Class].length; i++) {
      const curDayOfWeek = fieldData[Field.DayOfWeek][i];

      jsonResultData.data.push([
        fieldData[Field.Class][i],
        parseInt(curDayOfWeek === 'CN' ? '8' : curDayOfWeek),
        fieldData[Field.StartDate][i],
        fieldData[Field.EndDate][i],
        fieldData[Field.Session][i],
        // fieldData[Field.Teacher][i] ?? '',
      ]);
    }
  }

  // Write the JSON data to a file
  fs.writeFileSync(JSON_PATH, JSON.stringify(jsonResultData, null, 2), 'utf8');

  console.log('File written successfully!');
}

main();
