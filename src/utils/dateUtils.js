export const formatDateTime = (date) => {
    if (!date) return '';
    let d = new Date(date);

    if (isNaN(d.getTime()) && typeof date === 'string') {
        const parts = date.trim().split(/[\sT]+/);
        const dateParts = parts[0].split(/[\/\-]/);
        if (dateParts.length === 3) {
            let [day, month, year] = dateParts;
            if (day.length === 4) {
                [year, month, day] = [day, month, year];
            }
            const timePart = parts[1] || '00:00:00';
            d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`);
        }
    }

    if (isNaN(d.getTime())) return '';

    const pad = (n) => n.toString().padStart(2, '0');

    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
