// 2023-12-05
export const toYYYYMMDD = (utcDate: Date) => utcDate.toISOString().split('T')[0];

// Monday, Sep 30
export const toDayMonthDate = (utcDate: Date) => {
  const weekDay = utcDate.toLocaleString('en-us', {weekday: 'long'});
  const month = utcDate.toLocaleString('en-us', {month: 'short'});
  const date = utcDate.getDate();
  return `${weekDay}, ${month} ${date}`;
};

// return in seconds
export const getDateTimeDiffInSeconds = (end: Date, start: Date) => {
  const seconds = (end.getTime() - start.getTime()) / 1000;
  return Math.round(seconds);
};

// const toHHMMSS = function (sec) {
//   var seconds = parseInt(sec, 10); // don't forget the second param
//   var hours = Math.floor(seconds / 3600);
//   var minutes = Math.floor((seconds - hours * 3600) / 60);
//   seconds = seconds - hours * 3600 - minutes * 60;

//   if (hours < 10) {
//     hours = '0' + hours;
//   }
//   if (minutes < 10) {
//     minutes = '0' + minutes;
//   }
//   if (seconds < 10) {
//     seconds = '0' + seconds;
//   }
//   var time = hours + 'H : ' + minutes + 'M : ' + seconds + 'S';
//   return time;
// };
