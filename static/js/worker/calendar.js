const workerCalculateCalendarTableContent = (
    calendarTableContent,
    dateList,
    sessions,
    selectedCalendar
) => {
    let isConflict = false;
    for (const date of dateList) {
        const dateKey = date;
        const resultDate = calendarTableContent[dateKey];
        for (const session of sessions) {
            resultDate[session] = workerGetSessionContent(selectedCalendar, date, session);
            if (resultDate[session].length > 1) isConflict = true;
        }
    }
    return {
        calendarTableContent,
        isConflict
    };
};

const workerGetSessionContent = (selectedCalendar, date, session) => {
    const result = [];
    let dateDayOfWeek = new Date(date).getDay() + 1;
    if (dateDayOfWeek === 1) dateDayOfWeek = 8;

    for (const subjectName in selectedCalendar) {
        const currentSubject = selectedCalendar[subjectName];
        if (!currentSubject.isChecked || !currentSubject.class) continue;
        for (const currentSubjectClassDetail of currentSubject.class.details) {
            // filter
            {
                if (
                    !(
                        currentSubjectClassDetail.startDate <= date &&
                        currentSubjectClassDetail.endDate >= date
                    )
                )
                    continue;
                if (dateDayOfWeek !== currentSubjectClassDetail.dayOfWeek) continue;
                if (
                    session < currentSubjectClassDetail.startSession ||
                    session > currentSubjectClassDetail.endSession
                )
                    continue;
            }
            // add detail to result
            result.push(currentSubjectClassDetail);
            break;
        }
    }

    return result;
};

self.onmessage = (message) => {
    message = message.data
    switch (message.type) {
        case 'calculateCalendarTableContent': {
            self.postMessage(
                workerCalculateCalendarTableContent(
                    message.data.calendarTableContent,
                    message.data.dateList,
                    message.data.sessions,
                    message.data.selectedCalendar
                )
            );
            break;
        }
        default:
            self.postMessage(null);
    }
};
