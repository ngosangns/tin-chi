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
					subject_tree[key].unshift(...JSON.parse(JSON.stringify(theory_class)));
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
				if (subject_tree[name + `(${theory_code})`]) delete subject_tree[name + `(${theory_code})`];
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
			match = defaultName.match(/(.+?\d) \((.+)\)$/),
			nameOnly = match && match.length == 3 ? match[1] : '',
			codeOnly = match && match.length == 3 ? match[2] : '',
			startDate = v[2] ? Date.parse('20' + v[2].split('/').reverse().join('-')) : 0,
			endDate = v[3] ? Date.parse('20' + v[3].split('/').reverse().join('-')) : 0,
			match2 = v[4].split('->'),
			startSession = match2.length == 2 ? parseInt(match2[0]) : 0,
			endSession = match2.length == 2 ? parseInt(match2[1]) : 0;

		let majors: string[] | null;
		let _majors: string = codeOnly.split('.')[0];
		if (_majors.match(/(\d{3,}$)|((\d+)N\d{2}$)|(C(\d+)D\d{2}$)/g)) _majors = _majors.slice(0, -2);
		majors = _majors.match(/([A-Z]{1}\d{1,2})/g);
		majors = majors ? majors.map((m) => m[0] + 'T' + m.slice(1)) : null;

		// check invalid data
		if (defaultName == '') {
			throw new Error('invalid subject name: data has empty subject name');
		}
		if ([defaultName, codeOnly, nameOnly].includes('')) {
			throw new Error(`invalid subject name: ${defaultName}`);
		}

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
			endSession
		};
	});

	const calendarGroupBySubjectName = processGroupByNameCalendar(calendar);
	const calendarGroupByMajor = processGroupByMajorCalendar(calendarGroupBySubjectName);

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
		dateList
	};
}

function processGroupByNameCalendar(data: Array<Calendar>): CalendarGroupBySubjectName {
	const result: CalendarGroupBySubjectName = {};
	for (const item of data) {
		if (!(item.nameOnly in result)) {
			result[item.nameOnly] = <CalendarGroupBySubjectNameDetail>{
				majors: item.majors,
				classes: <CalendarGroupByClass>{}
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
						endSession: item.endSession
					}
				]
			};
		} else {
			subject.classes[item.codeOnly].details.push(<CalendarGroupBySessionDetail>{
				defaultName: item.defaultName,
				startDate: item.startDate,
				endDate: item.endDate,
				dayOfWeek: item.dayOfWeek,
				startSession: item.startSession,
				endSession: item.endSession
			});
		}
	}
	return result;
}

function processGroupByMajorCalendar(data: CalendarGroupBySubjectName): CalendarGroupByMajor {
	const result: CalendarGroupByMajor = {};
	for (const subjectName in data) {
		const subject = data[subjectName];
		if (!subject.majors) subject.majors = ['Chưa phân loại'];
		for (const major of subject.majors) {
			if (!(major in result)) {
				result[major] = <CalendarGroupByMajorDetail>{
					subjects: <CalendarGroupBySubjectName>{
						[subjectName]: subject
					}
				};
			} else {
				result[major].subjects[subjectName] = subject;
			}
		}
	}
	return result;
}
