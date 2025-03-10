import {
    differenceInDays,
    differenceInMonths,
    differenceInYears,
    format,
    parseISO,
} from 'date-fns';

const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';
const DATE_FORMAT = 'dd/MM/yyyy';
const TIME_FORMAT = 'hh:mm';

const formatFHIRDate = (date: string, formatType: string) => {
    try {
        return format(parseISO(date), formatType);
    } catch {
        console.error(`Invalid date format: ${date}`);
        return String(date);
    }
};

export const formatHumanDateTime = (date: string) => {
    return formatFHIRDate(date, DATE_TIME_FORMAT);
};

export const formatHumanTime = (date: string) => {
    return formatFHIRDate(date, TIME_FORMAT);
};

export const formatHumanDate = (date: string) => {
    return formatFHIRDate(date, DATE_FORMAT);
};

export function getYears(date: string) {
    return differenceInYears(new Date(), parseISO(date));
}

export function getMonths(date: string) {
    return differenceInMonths(new Date(), parseISO(date));
}

export function getDays(date: string) {
    return differenceInDays(new Date(), parseISO(date));
}

export function getPersonAge(date: string) {
    if (getYears(date) > 0) {
        return `${getYears(date)} y.o.`;
    }

    if (getMonths(date) > 0) {
        return `${getMonths(date)} m.o.`;
    }

    return `${getDays(date)} d.o.`;
}
