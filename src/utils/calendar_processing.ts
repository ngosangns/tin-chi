import {
  RawCalendar,
  CalendarData,
  Calendar,
  CalendarGroupBySubjectName,
  CalendarGroupBySubjectNameDetail,
  CalendarGroupByClass,
  CalendarGroupByClassDetail,
  CalendarGroupBySession,
  CalendarGroupBySessionDetail,
  CalendarGroupByMajor,
  CalendarGroupByMajorDetail,
} from '../types/calendar';

/**
 * Xử lý dữ liệu lịch học thô thành dữ liệu có cấu trúc
 *
 * @param rawData - Mảng dữ liệu lịch học thô từ nguồn
 *
 * @returns Đối tượng CalendarData chứa:
 * - calendar: Mảng các đối tượng Calendar đã được xử lý
 * - calendarGroupByMajor: Lịch được nhóm theo ngành học
 * - calendarGroupBySubjectName: Lịch được nhóm theo tên môn học
 * - minTime: Thời gian bắt đầu sớm nhất (timestamp)
 * - maxTime: Thời gian kết thúc muộn nhất (timestamp)
 * - dateList: Danh sách các ngày trong khoảng thời gian từ minTime đến maxTime
 *
 * @throws {Error} Khi:
 * - Tên môn học rỗng
 * - Định dạng tên môn học không hợp lệ
 * - Không có dữ liệu thời gian bắt đầu/kết thúc
 *
 * @remarks
 * Hàm thực hiện các bước xử lý:
 * 1. Nhóm các môn học theo mã môn
 * 2. Kết hợp lớp thực hành với lớp lý thuyết tương ứng
 * 3. Loại bỏ các lớp lý thuyết đã được kết hợp
 * 4. Xử lý và chuẩn hóa thông tin ngành học
 * 5. Tính toán thời gian bắt đầu/kết thúc của toàn bộ lịch
 * 6. Nhóm lịch theo tên môn học và theo ngành
 */
export function processCalendar(rawData: Array<RawCalendar>): CalendarData {
  // Nhóm mã môn học
  {
    const subjectTree: Record<string, RawCalendar[]> = {};

    // Nhóm các môn học theo tên
    rawData.forEach((item) => {
      const subjectName = item[0];
      if (!subjectTree[subjectName]) {
        subjectTree[subjectName] = [item];
      } else {
        subjectTree[subjectName].push(item);
      }
    });

    // Thêm lớp lý thuyết vào lớp thực hành
    for (const key in subjectTree) {
      const name = key.replace(/\((.+?)\)$/i, '');
      const isPracticeClass = key.match(/\((.+?)\.\d{1,}\)$/i);
      if (isPracticeClass) {
        const theoryCode = isPracticeClass[1];
        const theoryClass = subjectTree[name + `(${theoryCode})`];
        if (theoryClass) {
          subjectTree[key].unshift(...JSON.parse(JSON.stringify(theoryClass)));
          subjectTree[key].forEach((item) => {
            item[0] = key; // Cập nhật tên môn học
          });
        }
      }
    }

    // Loại bỏ các lớp lý thuyết
    for (const key in subjectTree) {
      const name = key.replace(/\((.+?)\)$/i, '');
      const isPracticeClass = key.match(/\((.+?)\.\d{1,}\)$/i);
      if (isPracticeClass) {
        const theoryCode = isPracticeClass[1];
        delete subjectTree[name + `(${theoryCode})`];
      }
    }

    // Chuyển đổi cây môn học trở lại thành rawData
    rawData = Object.values(subjectTree).flat();
  }

  let minTime = 0,
    maxTime = 0;
  const dateList: number[] = [];

  const calendar = rawData.map((v) => {
    // Chuẩn hóa tên môn học và tách mã môn học
    const defaultName = v[0].trim().replace(/(\s+|\t+)/gm, ' ');
    const match = defaultName.match(/^(.+)(\(.+\))$/);
    const nameOnly = match && match.length === 3 ? match[1] : '';
    const codeOnly =
      match && match.length === 3
        ? match[2].replace('(', '').replace(')', '')
        : '';

    // Chuyển đổi ngày bắt đầu và kết thúc thành timestamp
    const startDate = v[2]
      ? Date.parse('20' + v[2].split('/').reverse().join('-'))
      : 0; // Ví dụ: 20/10/21 -> 2021-10-20
    const endDate = v[3]
      ? Date.parse('20' + v[3].split('/').reverse().join('-'))
      : 0; // Ví dụ: 20/10/21 -> 2021-10-20

    // Tách buổi học bắt đầu và kết thúc
    const match2 = v[4].split('->');
    const startSession = match2.length === 2 ? parseInt(match2[0]) : 0;
    const endSession = match2.length === 2 ? parseInt(match2[1]) : 0;

    // Khởi tạo danh sách ngành học
    let majors: string[] | null = null;
    let _majors: string = codeOnly.split('.')[0];

    // Chuẩn hóa mã ngành trước khi xử lý
    _majors = _majors.replace('T', '');

    // Phân loại ngành học
    if (
      _majors.match(
        /^(A(\d{1,2})|AT(\d{1,2}))(C(\d{1,2})|CT(\d{1,2}))(D(\d{1,2})|DT(\d{1,2}))S*/g
      )
    ) {
      // Tất cả các ngành
      majors = _majors.match(/^(A(\d{1,2})|AT(\d{1,2}))S*/g);
    } else if (
      _majors.match(/^(A(\d{1,2})|AT(\d{1,2}))(C(\d{1,2})|CT(\d{1,2}))S*/g)
    ) {
      // AT & CT
      majors = _majors.match(/^(A(\d{1,2})|AT(\d{1,2}))S*/g);
    } else if (
      _majors.match(/^(C(\d{1,2})|CT(\d{1,2}))(D(\d{1,2})|DT(\d{1,2}))S*/g)
    ) {
      // CT & DT
      majors = _majors.match(
        /^(C(\d{1,2})|CT(\d{1,2}))(D(\d{1,2})|DT(\d{1,2}))S*/g
      );
    } else if (_majors.match(/^(A(\d{1,2})|AT(\d{1,2}))S*/g)) {
      // Chỉ AT
      majors = _majors.match(/^(A(\d{1,2})|AT(\d{1,2}))S*/g);
    } else if (_majors.match(/^(C(\d{1,2})|CT(\d{1,2}))S*/g)) {
      // Chỉ CT
      majors = _majors.match(/^(C(\d{1,2})|CT(\d{1,2}))S*/g);
    } else if (_majors.match(/^(D(\d{1,2})|DT(\d{1,2}))S*/g)) {
      // Chỉ DT
      majors = _majors.match(/^(D(\d{1,2})|DT(\d{1,2}))S*/g);
    }

    // Chuẩn hóa mã ngành để dễ đọc
    if (majors) {
      majors[0] = majors[0].replace(/(\D*)(0+)([1-9]{1,2})D*/g, '$1$3');
      majors[0] = majors[0].replace('A', 'AT');
      majors[0] = majors[0].replace('C', 'CT');
      majors[0] = majors[0].replace('D', 'DT');
    }

    // Kiểm tra dữ liệu không hợp lệ
    if (defaultName === '')
      throw new Error('invalid subject name: data has empty subject name');
    if ([defaultName, codeOnly, nameOnly].includes(''))
      throw new Error(`invalid subject name: ${defaultName}`);

    // Thiết lập thời gian bắt đầu và kết thúc nhỏ nhất/lớn nhất
    minTime = minTime ? (minTime > startDate ? startDate : minTime) : startDate;
    maxTime = maxTime ? (maxTime < endDate ? endDate : maxTime) : endDate;

    return <Calendar>{
      defaultName: defaultName,
      majors,
      nameOnly,
      codeOnly,
      dayOfWeek: v[1] - 1 === 7 ? 0 : v[1] - 1, // Chuyển đổi từ thứ 2 -> chủ nhật sang 0 -> 6
      startDate,
      endDate,
      startSession,
      endSession,
    };
  });

  const calendarGroupBySubjectName = processGroupByNameCalendar(calendar);
  const calendarGroupByMajor = processGroupByMajorCalendar(
    calendarGroupBySubjectName
  );

  if (!minTime || !maxTime) {
    throw new Error(`invalid data - empty min/max time`);
  }

  for (let i = minTime; i <= maxTime; i += 86400000 /* 1 day */) {
    dateList.push(i);
  }

  return <CalendarData>{
    calendar,
    calendarGroupByMajor,
    calendarGroupBySubjectName,
    minTime: minTime ? minTime : 0,
    maxTime: maxTime ? maxTime : 0,
    dateList,
  };
}

/**
 * Nhóm lịch theo tên môn học
 *
 * @param data - Mảng các đối tượng Calendar đã được xử lý
 *
 * @returns Đối tượng CalendarGroupBySubjectName chứa các môn học đã được nhóm
 */
function processGroupByNameCalendar(
  data: Array<Calendar>
): CalendarGroupBySubjectName {
  const result: CalendarGroupBySubjectName = {};

  data.forEach((item) => {
    // Nếu môn học chưa tồn tại trong kết quả, khởi tạo đối tượng mới
    if (!(item.nameOnly in result)) {
      result[item.nameOnly] = <CalendarGroupBySubjectNameDetail>{
        majors: item.majors,
        subjectName: item.nameOnly,
        classes: <CalendarGroupByClass>{},
        selectedClass: '',
        displayOnCalendar: false,
      };
    }

    const subject = result[item.nameOnly];

    // Nếu lớp học chưa tồn tại trong môn học, khởi tạo đối tượng mới
    if (!(item.codeOnly in subject.classes)) {
      subject.classes[item.codeOnly] = <CalendarGroupByClassDetail>{
        majors: item.majors,
        subjectName: item.nameOnly,
        subjectClassCode: item.codeOnly,
        details: <CalendarGroupBySession>[
          {
            defaultName: item.defaultName,
            startDate: item.startDate,
            endDate: item.endDate,
            dayOfWeek: item.dayOfWeek,
            startSession: item.startSession,
            endSession: item.endSession,
          },
        ],
      };
    } else {
      // Nếu lớp học đã tồn tại, thêm chi tiết buổi học vào
      subject.classes[item.codeOnly].details.push(<
        CalendarGroupBySessionDetail
      >{
        defaultName: item.defaultName,
        startDate: item.startDate,
        endDate: item.endDate,
        dayOfWeek: item.dayOfWeek,
        startSession: item.startSession,
        endSession: item.endSession,
      });
    }
  });

  return result;
}
/**
 * Nhóm lịch theo ngành học
 *
 * @param data - Đối tượng CalendarGroupBySubjectName chứa các môn học đã được nhóm
 *
 * @returns Đối tượng CalendarGroupByMajor chứa các ngành học đã được nhóm
 */
function processGroupByMajorCalendar(
  data: CalendarGroupBySubjectName
): CalendarGroupByMajor {
  const result: CalendarGroupByMajor = {};

  // Duyệt qua từng môn học trong dữ liệu
  for (const subjectName in data) {
    const subject = data[subjectName];

    // Nếu môn học chưa có ngành học, gán giá trị mặc định
    if (!subject.majors || subject.majors.length === 0) {
      subject.majors = ['Chưa phân loại'];
    }

    // Duyệt qua từng ngành học của môn học
    for (const major of subject.majors) {
      // Nếu ngành học chưa tồn tại trong kết quả, khởi tạo đối tượng mới
      if (!(major in result)) {
        result[major] = <CalendarGroupByMajorDetail>{
          major,
          subjects: <CalendarGroupBySubjectName>{
            [subjectName]: subject,
          },
          expanded: false, // Thuộc tính bổ sung cho trang lịch
        };
      } else {
        // Nếu ngành học đã tồn tại, thêm môn học vào
        result[major].subjects[subjectName] = subject;
      }
    }
  }

  return result;
}
