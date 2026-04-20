import prisma from '../../config/db.js';

const getFirstDefined = (payload, keys) => {
    for (const key of keys) {
        if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
            return payload[key];
        }
    }
    return undefined;
};

const toStringValue = (value, fieldName, { required = true } = {}) => {
    if (value === undefined) {
        if (required) {
            throw new Error(`${fieldName} is required`);
        }
        return null;
    }

    return String(value).trim();
};

const toIntValue = (value, fieldName, { required = true } = {}) => {
    if (value === undefined) {
        if (required) {
            throw new Error(`${fieldName} is required`);
        }
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        throw new Error(`${fieldName} must be a valid integer`);
    }

    return parsed;
};

const toBigIntValue = (value, fieldName, { required = true } = {}) => {
    if (value === undefined) {
        if (required) {
            throw new Error(`${fieldName} is required`);
        }
        return null;
    }

    try {
        return BigInt(value);
    } catch (error) {
        throw new Error(`${fieldName} must be a valid bigint`);
    }
};

const toDateValue = (value, fieldName, { required = true } = {}) => {
    if (value === undefined) {
        if (required) {
            throw new Error(`${fieldName} is required`);
        }
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`${fieldName} must be a valid date`);
    }

    return parsed;
};

const toBooleanValue = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value === 1;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'y'].includes(normalized)) {
            return true;
        }
        if (['0', 'false', 'no', 'n'].includes(normalized)) {
            return false;
        }
    }

    return Boolean(value);
};

const serializeHinaiOrder = (order) => ({
    ...order,
    mr_no: order.mr_no?.toString() ?? null,
    site_id: order.site_id?.toString() ?? null,
    clearance_by: order.clearance_by?.toString() ?? null,
});

const mapHinaiOrderPayload = (payload) => {
    const patientId = getFirstDefined(payload, ['patient_id', 'PATIENT_ID']);
    const mrNo = getFirstDefined(payload, ['mr_no', 'MRNO']);
    const patientName = getFirstDefined(payload, ['patient_name', 'PATIENT']);
    const admissionNo = getFirstDefined(payload, ['admission_no', 'ADMISSIONNUMBER', 'admno']);
    const admissionAt = getFirstDefined(payload, ['admission_at', 'ADMDATE', 'admdatetime']);
    const bedNo = getFirstDefined(payload, ['bed_no', 'BED_NO']);
    const ward = getFirstDefined(payload, ['ward', 'SCNAME']);
    const doctor = getFirstDefined(payload, ['doctor', 'DOCTOR']);
    const menu = getFirstDefined(payload, ['menu', 'MENU']);
    const menuDetail = getFirstDefined(payload, ['menu_detail', 'NAME', 'menudetail']);
    const orderDate = getFirstDefined(payload, ['order_date', 'ORDDATE', 'orderdate']);
    const timeDiff = getFirstDefined(payload, ['time_diff', 'DIFF', 'timediff']);
    const dietType = getFirstDefined(payload, ['diet_type', 'DIETTYPE', 'diettype']);
    const orderId = getFirstDefined(payload, ['order_id', 'HINAIORDERID', 'orderid']);
    const nursingUser = getFirstDefined(payload, ['nursing_user', 'USERNAME', 'nursinguser']);
    const isDietChange = getFirstDefined(payload, ['is_diet_change', 'ISDIETCHANGED', 'isdietchange']);
    const diagnosis = getFirstDefined(payload, ['diagnosis', 'DIAGNOSIS']);
    const ageGender = getFirstDefined(payload, ['age_gender', 'AGEGENDER', 'agegender']);
    const mobileNo = getFirstDefined(payload, ['mobile_no', 'MOBILENO', 'mobileno']);
    const email = getFirstDefined(payload, ['email', 'EMAIL']);
    const nurseRemark = getFirstDefined(payload, ['nurse_remark', 'NURSEREMARK', 'nurseremark']);
    const approvedDate = getFirstDefined(payload, ['approved_date', 'APPROVEDDATE', 'ord_approveddate']);
    const siteId = getFirstDefined(payload, ['site_id', 'SITEID', 'siteid']);
    const status = getFirstDefined(payload, ['status']);
    const isDischarge = getFirstDefined(payload, ['is_discharge']);
    const isTransfer = getFirstDefined(payload, ['is_transfer']);
    const clearance = getFirstDefined(payload, ['clearance']);
    const outTime = getFirstDefined(payload, ['out_time']);
    const outBy = getFirstDefined(payload, ['out_by']);
    const remarks = getFirstDefined(payload, ['remarks']);
    const clearanceTime = getFirstDefined(payload, ['clearance_time']);
    const clearanceBy = getFirstDefined(payload, ['clearance_by']);

    return {
        patient_id: toIntValue(patientId, 'patient_id'),
        mr_no: toBigIntValue(mrNo, 'mr_no'),
        patient_name: toStringValue(patientName, 'patient_name'),
        admission_no: toStringValue(admissionNo, 'admission_no'),
        admission_at: toDateValue(admissionAt, 'admission_at'),
        bed_no: toStringValue(bedNo, 'bed_no'),
        ward: toStringValue(ward, 'ward'),
        doctor: toStringValue(doctor, 'doctor'),
        menu: toStringValue(menu, 'menu'),
        menu_detail: toStringValue(menuDetail, 'menu_detail'),
        order_date: toDateValue(orderDate, 'order_date'),
        time_diff: toIntValue(timeDiff, 'time_diff'),
        diet_type: toIntValue(dietType, 'diet_type'),
        order_id: toIntValue(orderId, 'order_id'),
        status: toBooleanValue(status, true),
        nurse_remark: toStringValue(nurseRemark, 'nurse_remark', { required: false }),
        is_discharge: toBooleanValue(isDischarge, false),
        nursing_user: toStringValue(nursingUser, 'nursing_user'),
        is_diet_change: toBooleanValue(isDietChange, false),
        is_transfer: toBooleanValue(isTransfer, false),
        age_gender: toStringValue(ageGender, 'age_gender'),
        mobile_no: toStringValue(mobileNo, 'mobile_no', { required: false }),
        email: toStringValue(email, 'email', { required: false }),
        site_id: toBigIntValue(siteId, 'site_id', { required: false }),
        clearance: clearance === undefined ? null : toBooleanValue(clearance),
        out_time: toStringValue(outTime, 'out_time', { required: false }),
        out_by: toStringValue(outBy, 'out_by', { required: false }),
        remarks: toStringValue(remarks, 'remarks', { required: false }),
        clearance_time: toStringValue(clearanceTime, 'clearance_time', { required: false }),
        clearance_by: toBigIntValue(clearanceBy, 'clearance_by', { required: false }),
        diagnosis: toStringValue(diagnosis, 'diagnosis', { required: false }),
        approved_date: approvedDate === undefined ? null : toDateValue(approvedDate, 'approved_date'),
    };
};

export const createHinaiOrder = async (body) => {
    const data = mapHinaiOrderPayload(body);

    const existingOrder = await prisma.hinaiOrder.findUnique({
        where: { order_id: data.order_id },
    });

    if (existingOrder) {
        return {
            created: false,
            ignored: true,
            order: serializeHinaiOrder(existingOrder),
        };
    }

    const order = await prisma.hinaiOrder.create({ data });

    return {
        created: true,
        ignored: false,
        order: serializeHinaiOrder(order),
    };
};

const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
};

export const markHinaiOrderTransfer = async (body) => {
    const patientId = toIntValue(
        getFirstDefined(body, ['patient_id', 'PATIENT_ID']),
        'patient_id'
    );
    const bedNo = toStringValue(
        getFirstDefined(body, ['bed_no', 'TOBED', 'to_bed']),
        'bed_no'
    );
    const ward = toStringValue(
        getFirstDefined(body, ['ward', 'TOWARD', 'to_ward']),
        'ward'
    );

    const { start, end } = getTodayRange();

    const result = await prisma.hinaiOrder.updateMany({
        where: {
            patient_id: patientId,
            created_at: {
                gte: start,
                lt: end,
            },
            deleted_at: null,
        },
        data: {
            is_transfer: true,
            bed_no: bedNo,
            ward,
        },
    });

    return {
        updated: result.count > 0,
        count: result.count,
        patient_id: patientId,
        bed_no: bedNo,
        ward,
        filter_date: start.toISOString().slice(0, 10),
    };
};

export const markHinaiOrderDischarge = async (body) => {
    const admissionNo = toStringValue(
        getFirstDefined(body, ['admission_no', 'ADMISSIONNO', 'admno']),
        'admission_no'
    );
    const patientId = toIntValue(
        getFirstDefined(body, ['patient_id', 'PATIENTID', 'PATIENT_ID']),
        'patient_id'
    );

    const result = await prisma.hinaiOrder.updateMany({
        where: {
            admission_no: admissionNo,
            patient_id: patientId,
            deleted_at: null,
        },
        data: {
            is_discharge: true,
        },
    });

    return {
        updated: result.count > 0,
        count: result.count,
        admission_no: admissionNo,
        patient_id: patientId,
    };
};
