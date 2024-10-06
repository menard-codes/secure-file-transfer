import { ExpirationEnum } from "./schemas";

export function getExpISOString(expStr: ExpirationEnum) {
    const now = new Date();
    switch (expStr) {
        case '7 Days':
            now.setDate(now.getDate() + 7);
            break;
        case '3 Days':
            now.setDate(now.getDate() + 3);
            break;
        case '24 Hours':
            now.setHours(now.getHours() + 24);
            break;
        case '12 Hours':
            now.setHours(now.getHours() + 12);
            break;
        case '4 Hours':
            now.setHours(now.getHours() + 4);
            break;
        case '1 Hour':
            now.setHours(now.getHours() + 1);
            break;
        case '5 Minutes':
            now.setMinutes(now.getMinutes() + 5);
            break;
        case '1 Minute':
            now.setMinutes(now.getMinutes() + 1);
            break;
    }

    return now.toISOString();
}
