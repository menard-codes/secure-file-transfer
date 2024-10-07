import { ExpirationEnum } from "./schemas";

export function getExpISOString(expStr: ExpirationEnum) {
    const now = new Date();
    const msSecond = 1_000;
    const msMinute = msSecond * 60;
    const msHour = msMinute * 60;
    const msDay = msHour * 24;
    let msExpiration = now.getTime();
    switch (expStr) {
        case '7 Days':
            msExpiration += msDay * 7;
            break;
        case '3 Days':
            msExpiration += msDay * 3;
            break;
        case '24 Hours':
            msExpiration += msHour * 24;
            break;
        case '12 Hours':
            msExpiration += msHour * 12;
            break;
        case '4 Hours':
            msExpiration += msHour * 4;
            break;
        case '1 Hour':
            msExpiration += msHour;
            break;
        case '5 Minutes':
            msExpiration += msMinute * 5;
            break;
        default:
            throw new Error('Invalid expiration string');
    }
    const expirationDate = new Date(msExpiration);
    return expirationDate.toISOString();
}
