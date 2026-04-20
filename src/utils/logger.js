import { createLogger, format, transports } from 'winston';
import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';

// Helper for DD-MM-YYYY format
const getFormattedDate = () => {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
};

// Native Stream to handle Daily Rotation (Matching zydus-api pattern)
class DailyStream extends Writable {
    constructor(subPath = 'logs') {
        super();
        this.dir = path.join(process.cwd(), subPath);
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir, { recursive: true });
        }
        this.currentDate = getFormattedDate();
        this.stream = this.createStream();
    }

    createStream() {
        const filePath = path.join(this.dir, `${this.currentDate}.log`);
        return fs.createWriteStream(filePath, { flags: 'a' });
    }

    _write(chunk, encoding, callback) {
        const today = getFormattedDate();
        if (today !== this.currentDate) {
            this.currentDate = today;
            this.stream.end(() => {
                this.stream = this.createStream();
                this.stream.write(chunk, encoding, callback);
            });
        } else {
            this.stream.write(chunk, encoding, callback);
        }
    }
}

// Helper for IST Timestamp: dd-mm-yyyy hh:mm:ss AM/PM
const getISTTimestamp = () => {
    const date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    let hh = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    hh = hh ? hh : 12;
    return `${dd}-${mm}-${yyyy} ${String(hh).padStart(2, '0')}:${min}:${sec} ${ampm}`;
};

const buildLogger = (subPath = 'logs') => createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: getISTTimestamp }),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}] ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.Stream({ stream: new DailyStream(subPath) })
    ]
});

const logger = buildLogger();

export const createAppLogger = (subPath) => buildLogger(subPath);

export default logger;
