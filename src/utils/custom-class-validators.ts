import {Matches} from 'class-validator';

// 9999-12-31
export const IsYYYYMMDD = () =>
  Matches(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/, {
    message: val => {
      return `${val.property} must match yyyy:mm:dd`;
    },
  });

// 9999-12-31
export const IsHHMMSS = () =>
  Matches(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/, {
    message: val => {
      return `${val.property} must match HH:MM:SS (from 00:00:00 to 23:59:59)`;
    },
  });
