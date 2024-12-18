export type CalendarTableContent = {
  [date: string]: {
    [session: number]: { defaultName: string }[];
  };
};

export type SelectedCalendar = {
  [subjectName: string]: {
    isChecked: boolean;
    class: {
      code: string;
      details: CalendarGroupBySession;
    } | null;
  };
};

export type RawCalendar = [string, number, string, string, string];

export type CalendarData = {
  calendar: Calendar[];
  calendarGroupBySubjectName: CalendarGroupBySubjectName;
  calendarGroupByMajor: CalendarGroupByMajor;
  minTime: number;
  maxTime: number;
  dateList: number[];
};

export type Calendar = {
  defaultName: string;
  majors: string[];
  nameOnly: string;
  codeOnly: string;
  dayOfWeek: number;
  startDate: number;
  endDate: number;
  startSession: number;
  endSession: number;
};

export type CalendarGroupByMajor = {
  [major: string]: CalendarGroupByMajorDetail;
};

export type CalendarGroupByMajorDetail = {
  subjects: CalendarGroupBySubjectName;
};

export type CalendarGroupBySubjectName = {
  [subjectName: string]: CalendarGroupBySubjectNameDetail;
};
export type CalendarGroupBySubjectNameDetail = {
  majors: string[];
  classes: CalendarGroupByClass;
};

export type CalendarGroupByClass = {
  [subjectClassCode: string]: CalendarGroupByClassDetail;
};
export type CalendarGroupByClassDetail = {
  details: CalendarGroupBySession;
};

export type CalendarGroupBySession = [CalendarGroupBySessionDetail];
export type CalendarGroupBySessionDetail = {
  defaultName: string;
  startDate: number;
  endDate: number;
  dayOfWeek: number;
  startSession: number;
  endSession: number;
};

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
  // group subject code
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subject_tree: any = {};
    for (let i = 0; i < rawData.length; i++) {
      if (!subject_tree[rawData[i][0]]) {
        subject_tree[rawData[i][0]] = [rawData[i]];
      } else {
        subject_tree[rawData[i][0]].push(rawData[i]);
      }
    }
    // add theory class to practice class
    for (const key in subject_tree) {
      const name = key.replace(/\((.+?)\)$/i, '');
      const is_practice_class = key.match(/\((.+?)\.\d{1,}\)$/i);
      if (is_practice_class) {
        const theory_code = is_practice_class[1];
        const theory_class = subject_tree[name + `(${theory_code})`];
        if (theory_class) {
          subject_tree[key].unshift(
            ...JSON.parse(JSON.stringify(theory_class))
          );
          for (let i = 0; i < subject_tree[key].length; i++) {
            subject_tree[key][i][0] = key; // update subject name
          }
        }
      }
    }
    // remove theory class
    for (const key in subject_tree) {
      const name = key.replace(/\((.+?)\)$/i, '');
      const is_practice_class = key.match(/\((.+?)\.\d{1,}\)$/i);
      if (is_practice_class) {
        const theory_code = is_practice_class[1];
        if (subject_tree[name + `(${theory_code})`])
          delete subject_tree[name + `(${theory_code})`];
      }
    }
    rawData = [];
    for (const key in subject_tree) {
      rawData.push(...subject_tree[key]);
    }
  }

  let minTime = 0,
    maxTime = 0;
  const dateList: number[] = [];

  const calendar = rawData.map((v) => {
    const defaultName = v[0].trim().replace(/(\s+|\t+)/gm, ' '),
      match = defaultName.match(/^(.+)(\(.+\))$/),
      nameOnly = match && match.length == 3 ? match[1] : '',
      codeOnly =
        match && match.length == 3
          ? match[2].replace('(', '').replace(')', '')
          : '',
      startDate = v[2]
        ? Date.parse('20' + v[2].split('/').reverse().join('-'))
        : 0,
      endDate = v[3]
        ? Date.parse('20' + v[3].split('/').reverse().join('-'))
        : 0,
      match2 = v[4].split('->'),
      startSession = match2.length == 2 ? parseInt(match2[0]) : 0,
      endSession = match2.length == 2 ? parseInt(match2[1]) : 0;

    let majors: string[] | null = null;
    let _majors: string = codeOnly.split('.')[0];

    // standardlization before process
    _majors = _majors.replace('T', '');

    // majors classification
    if (
      _majors.match(
        /^(A(\d{1,2})|AT(\d{1,2}))(C(\d{1,2})|CT(\d{1,2}))(D(\d{1,2})|DT(\d{1,2}))S*/g
      )
    ) {
      // all majors
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
      // AT only
      majors = _majors.match(/^(A(\d{1,2})|AT(\d{1,2}))S*/g);
    } else if (_majors.match(/^(C(\d{1,2})|CT(\d{1,2}))S*/g)) {
      // CT only
      majors = _majors.match(/^(C(\d{1,2})|CT(\d{1,2}))S*/g);
    } else if (_majors.match(/^(D(\d{1,2})|DT(\d{1,2}))S*/g)) {
      // DT only
      majors = _majors.match(/^(D(\d{1,2})|DT(\d{1,2}))S*/g);
    }

    // standardization for easy reading
    if (majors) {
      majors[0] = majors[0].replace(/(\D*)(0+)([1-9]{1,2})D*/g, '$1$3');
      majors[0] = majors[0].replace('A', 'AT');
      majors[0] = majors[0].replace('C', 'CT');
      majors[0] = majors[0].replace('D', 'DT');
    }

    // check invalid data
    if (defaultName == '')
      throw new Error('invalid subject name: data has empty subject name');
    if ([defaultName, codeOnly, nameOnly].includes(''))
      throw new Error(`invalid subject name: ${defaultName}`);

    // set min/max time
    minTime = minTime ? (minTime > startDate ? startDate : minTime) : startDate;
    maxTime = maxTime ? (maxTime < endDate ? endDate : maxTime) : endDate;

    return <Calendar>{
      defaultName: defaultName,
      majors,
      nameOnly,
      codeOnly,
      dayOfWeek: v[1],
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

function processGroupByNameCalendar(
  data: Array<Calendar>
): CalendarGroupBySubjectName {
  const result: CalendarGroupBySubjectName = {};
  for (const item of data) {
    if (!(item.nameOnly in result)) {
      result[item.nameOnly] = <CalendarGroupBySubjectNameDetail>{
        majors: item.majors,
        classes: <CalendarGroupByClass>{},
      };
    }
    const subject = result[item.nameOnly];
    if (!(item.codeOnly in subject.classes)) {
      subject.classes[item.codeOnly] = <CalendarGroupByClassDetail>{
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
  }
  return result;
}

function processGroupByMajorCalendar(
  data: CalendarGroupBySubjectName
): CalendarGroupByMajor {
  const result: CalendarGroupByMajor = {};
  for (const subjectName in data) {
    const subject = data[subjectName];
    if (!subject.majors || subject.majors.length == 0)
      subject.majors = ['Chưa phân loại'];

    for (const major of subject.majors)
      if (!(major in result))
        result[major] = <CalendarGroupByMajorDetail>{
          subjects: <CalendarGroupBySubjectName>{
            [subjectName]: subject,
          },
        };
      else result[major].subjects[subjectName] = subject;
  }
  return result;
}
