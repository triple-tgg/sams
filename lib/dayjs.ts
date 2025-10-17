import dayjs from 'dayjs'
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
dayjs.extend(buddhistEra);
// dayjs.locale('th');
// Day.js utility functions for date/time management
export const dateTimeUtils = {
  getCurrentDate: () => dayjs().format('YYYY-MM-DD'),
  getCurrentTime: () => dayjs().format('HH:mm'),
  getCurrentDateTime: () => dayjs().format('YYYY-MM-DD HH:mm'),
  formatDate: (date: string | Date) => dayjs(date).format('YYYY-MM-DD'),
  formatTime: (time: string | Date) => dayjs(time).format('HH:mm'),
  formatDateTime: (dateTime: string | Date) => dayjs(dateTime).format('YYYY-MM-DD HH:mm'),
  isValidDate: (date: string) => dayjs(date).isValid(),
  isValidTime: (time: string) => dayjs(`2000-01-01 ${time}`).isValid(),
  addDays: (date: string, days: number) => dayjs(date).add(days, 'day').format('YYYY-MM-DD'),
  subtractDays: (date: string, days: number) => dayjs(date).subtract(days, 'day').format('YYYY-MM-DD'),
  isSameDay: (date1: string, date2: string) => dayjs(date1).isSame(dayjs(date2), 'day'),
  isAfter: (date1: string, date2: string) => dayjs(date1).isAfter(dayjs(date2)),
  isBefore: (date1: string, date2: string) => dayjs(date1).isBefore(dayjs(date2)),
}