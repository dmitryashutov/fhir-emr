import { Period, PractitionerRoleAvailableTime } from 'shared/src/contrib/aidbox';

export type ScheduleBreak = Period & { removed?: boolean };
export type DaySchedule = Period & { breaks: ScheduleBreak[] };
export type DaySchedules = {
    [day: string]: DaySchedule;
};
export const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const daysMapping: { [x: string]: string } = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
};

export function fromAvailableTime(availableTimes: PractitionerRoleAvailableTime[]): DaySchedules {
    const availableTimesByDay = availableTimes.reduce(
        (acc, availableTime) =>
            (availableTime.daysOfWeek || []).reduce(
                (dayAcc, day) => ({
                    ...dayAcc,
                    [day]: [
                        ...(dayAcc[day] || []),
                        {
                            start: availableTime.availableStartTime,
                            end: availableTime.availableEndTime,
                        },
                    ],
                }),
                acc,
            ),
        {} as { [day: string]: Period[] },
    );

    return Object.keys(availableTimesByDay).reduce((acc, day) => {
        const dayAvailableTime = availableTimesByDay[day];
        if (!dayAvailableTime) {
            return acc;
        }

        const sortedDayAvailableTimes = dayAvailableTime.sort((a, b) =>
            a.start!.localeCompare(b.start!),
        );

        let breaks: ScheduleBreak[] = [];
        if (sortedDayAvailableTimes.length > 1) {
            for (let i = 0; i < sortedDayAvailableTimes.length - 1; i++) {
                const periodStart = sortedDayAvailableTimes[i]?.end;
                const periodEnd = sortedDayAvailableTimes[i + 1]?.start;
                if (periodStart && periodEnd) {
                    breaks.push({
                        start: periodStart,
                        end: periodEnd,
                    });
                }
            }
        }

        const startPeriod = sortedDayAvailableTimes[0];
        const endPeriod = sortedDayAvailableTimes[sortedDayAvailableTimes.length - 1];

        return {
            ...acc,
            ...(startPeriod && endPeriod
                ? { [day]: { start: startPeriod.start, end: endPeriod.end, breaks } }
                : {}),
        };
    }, {} as DaySchedules);
}

export function toAvailableTime(schedulesByDay: DaySchedules): PractitionerRoleAvailableTime[] {
    return Object.keys(schedulesByDay).reduce((acc, day) => {
        const schedule = schedulesByDay[day];

        if (!schedule) {
            return acc;
        }

        const sortedBreaks = (schedule.breaks || [])
            .filter(({ removed }) => !removed)
            .sort((a, b) => a.start!.localeCompare(b.start!));

        let start = schedule.start;
        let end;

        for (let i = 0; i < sortedBreaks.length; i++) {
            const currentBreak = sortedBreaks[i];

            if (!currentBreak) {
                continue;
            }

            end = currentBreak.start;

            acc.push({
                daysOfWeek: [day],
                availableStartTime: start,
                availableEndTime: end,
            });

            start = currentBreak.end;
        }

        end = schedule.end;

        acc.push({
            daysOfWeek: [day],
            availableStartTime: start,
            availableEndTime: end,
        });

        return acc;
    }, [] as PractitionerRoleAvailableTime[]);
}
