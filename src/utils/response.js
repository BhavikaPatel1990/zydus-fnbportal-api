const DATE_FORMATS = {
    DEFAULT: "DD-MM-YYYY hh:mm:ss A",
    SIMPLE: "DD-MM-YYYY HH:mm:ss",
    DATE_ONLY: "DD-MM-YYYY",
};

const DATETIME_FIELDS = [
    "created_at",
    "updated_at",
    "deleted_at",
    "order_date",
    "delivery_date",
];

const DATE_ONLY_FIELDS = [
    "date"
];

const formatDate = (date, format) => {
    if (!date) return null;
    const d = new Date(date);

    const ist = new Date(
        d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const pad = (n) => (n < 10 ? "0" + n : n);

    const day = pad(ist.getDate());
    const month = pad(ist.getMonth() + 1);
    const year = ist.getFullYear();

    let hours = ist.getHours();
    const minutes = pad(ist.getMinutes());
    const seconds = pad(ist.getSeconds());

    const ampm = hours >= 12 ? "PM" : "AM";

    let hours12 = hours % 12 || 12;
    hours12 = pad(hours12);

    const hours24 = pad(hours);

    return format
        .replace("DD", day)
        .replace("MM", month)
        .replace("YYYY", year)
        .replace("hh", hours12)
        .replace("HH", hours24)
        .replace("mm", minutes)
        .replace("ss", seconds)
        .replace("A", ampm);
};

const formatDatesFast = (data) => {
    if (!data) return data;

    if (typeof data === "bigint") {
        return data.toString();
    }

    if (Array.isArray(data)) {
        return data.map(item => formatDatesFast(item));
    }

    if (typeof data === "object" && data !== null) {
        if (data.data && Array.isArray(data.data)) {
            return {
                ...data,
                data: data.data.map(item => formatDatesFast(item))
            };
        }

        let updated = { ...data };
        let isUpdated = false;

        for (const key in data) {
            if (typeof data[key] === "bigint") {
                updated[key] = data[key].toString();
                isUpdated = true;
            }

            if (Array.isArray(data[key])) {
                updated[key] = data[key].map(item => formatDatesFast(item));
                isUpdated = true;
            }

            if (typeof data[key] === "object" && data[key] !== null && !(data[key] instanceof Date) && !Array.isArray(data[key])) {
                updated[key] = formatDatesFast(data[key]);
                isUpdated = true;
            }

            if (DATETIME_FIELDS.includes(key) && data[key]) {
                updated[key] = formatDate(data[key], DATE_FORMATS.DEFAULT);
                isUpdated = true;
            }

            if (DATE_ONLY_FIELDS.includes(key) && data[key]) {
                updated[key] = formatDate(data[key], DATE_FORMATS.DATE_ONLY);
                isUpdated = true;
            }
        }

        return isUpdated ? updated : data;
    }

    return data;
};

const response = {
    success: async (res, message, data) => {
        return res.status(200).json({
            status: true,
            message: message,
            data: formatDatesFast(data),
        });
    },
    error: async (res, message) => {
        return res.status(403).json({
            status: false,
            message: message,
            data: null,
        });
    },
    serverError: async (res, message) => {
        return res.status(400).json({
            status: false,
            message: message,
            data: null,
        });
    },
    authError: async (res, message) => {
        return res.status(401).json({
            status: false,
            message: message,
            data: null,
        });
    },
};

export default response;
