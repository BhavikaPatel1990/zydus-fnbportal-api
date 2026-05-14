export const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);

    const pad = (n) => n.toString().padStart(2, '0');

    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};




