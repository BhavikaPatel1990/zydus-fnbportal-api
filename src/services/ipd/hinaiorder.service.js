import prisma from '../../config/db.js';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL?.replace(/\/$/, '');

const hinaiOrderSelect = {
    id: true,
    patient_id: true,
    mr_no: true,
    patient_name: true,
    admission_no: true,
    admission_at: true,
    bed_no: true,
    ward: true,
    doctor: true,
    menu: true,
    menu_detail: true,
    order_date: true,
    time_diff: true,
    diet_type: true,
    order_id: true,
    status: true,
    nurse_remark: true,
    is_discharge: true,
    nursing_user: true,
    is_diet_change: true,
    is_transfer: true,
    age_gender: true,
    mobile_no: true,
    email: true,
    mst_id: true,
    clearance: true,
    out_time: true,
    out_by: true,
    remarks: true,
    clearance_time: true,
    clearance_by: true,
    diagnosis: true,
    approved_date: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    created_by: true,
    updated_by: true,
    deleted_by: true,
    is_active: true,
};

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
    mst_id: order.mst_id?.toString() ?? null,
    clearance_by: order.clearance_by?.toString() ?? null,
});

const getAuditUserId = (jwtUser) => jwtUser?.userId ?? jwtUser?.id ?? null;

const getSiteListApiUrl = () => {
    if (!AUTH_SERVICE_URL) {
        throw new Error('AUTH_SERVICE_URL is not configured');
    }

    return AUTH_SERVICE_URL.endsWith('/api')
        ? `${AUTH_SERVICE_URL}/site/list`
        : `${AUTH_SERVICE_URL}/api/site/list`;
};

const resolveSiteMapping = async (siteValue) => {
    if (siteValue === undefined) {
        return null;
    }

    const parsedSiteId = toIntValue(siteValue, 'site_id', { required: false });

    if (parsedSiteId === null) {
        return null;
    }

    const apiResponse = await axios.get(getSiteListApiUrl());
    const siteList = Array.isArray(apiResponse.data?.data) ? apiResponse.data.data : [];

    const siteRecordByExternalId = siteList.find(
        (site) => Number(site.site_id) === parsedSiteId
    );
    const siteRecordByMstId = siteList.find(
        (site) => Number(site.id) === parsedSiteId
    );
    const siteRecord = siteRecordByExternalId ?? siteRecordByMstId;

    if (!siteRecord) {
        throw new Error(`No active mst_site mapping found for site_id ${parsedSiteId}`);
    }

    return BigInt(siteRecord.id);
};

const mapHinaiOrderPayload = async (payload) => {
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
    const mstId = await resolveSiteMapping(siteId);

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
        mst_id: mstId,
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

export const createHinaiOrder = async (body, jwtUser) => {
    const data = await mapHinaiOrderPayload(body);
    const auditUserId = getAuditUserId(jwtUser);

    console.log(jwtUser);

    const existingOrder = await prisma.hinaiOrder.findUnique({
        where: { order_id: data.order_id },
        select: hinaiOrderSelect,
    });

    if (existingOrder) {
        return {
            created: false,
            ignored: true,
            order: serializeHinaiOrder(existingOrder),
        };
    }

    const order = await prisma.hinaiOrder.create({
        data: {
            ...data,
            created_by: auditUserId,
        },
        select: hinaiOrderSelect,
    });

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

export const markHinaiOrderTransfer = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);
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
            updated_by: auditUserId,
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

export const markHinaiOrderDischarge = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);
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
            updated_by: auditUserId,
        },
    });

    return {
        updated: result.count > 0,
        count: result.count,
        admission_no: admissionNo,
        patient_id: patientId,
    };
};

export const getHinaiOrders = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id', 'SITEID', 'siteid']);
    const viewdata = getFirstDefined(body, ['viewdata']) || '0';
    const ordertype = getFirstDefined(body, ['ordertype']) || '0';

    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = body.search || '';
    const offset = (page - 1) * limit;

    const mstId = await resolveSiteMapping(siteIdParam);
    if (!mstId) {
        throw new Error('Invalid site mapping');
    }

    const ctime = new Date().toISOString().split('T')[0];
    let whereConditions = [`mst_id = $1`, `is_discharge = false`];
    let subqueryWhere = [`mst_id = $1`];
    let params = [mstId];

    if (ordertype === 'extra') {
        whereConditions.push(`menu = 'EXTRA ORDER'`);
        subqueryWhere.push(`diet_type = 18894123`);
    } else if (ordertype === 'regular') {
        whereConditions.push(`menu != 'EXTRA ORDER'`);
        subqueryWhere.push(`diet_type != 18894123`);
    }

    if (viewdata === 'today') {
        params.push(ctime);
        const dateParam = `$${params.length}`;
        whereConditions.push(`to_char(order_date, 'YYYY-MM-DD') = ${dateParam}`);
        subqueryWhere.push(`to_char(order_date, 'YYYY-MM-DD') = ${dateParam}`);
    }

    if (search) {
        params.push(`%${search}%`);
        const searchParam = `$${params.length}`;
        whereConditions.push(`(
            h.patient_name ILIKE ${searchParam} OR
            h.mr_no::text ILIKE ${searchParam} OR
            h.bed_no ILIKE ${searchParam} OR
            h.ward ILIKE ${searchParam} OR
            h.doctor ILIKE ${searchParam} OR
            h.menu ILIKE ${searchParam} OR
            h.menu_detail ILIKE ${searchParam}
        )`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const subqueryWhereClause = `WHERE ${subqueryWhere.join(' AND ')}`;

    const countSql = `
        SELECT count(*) FROM "HinaiOrder" h
        ${whereClause}
        AND h.order_id IN (
            SELECT max(order_id) FROM "HinaiOrder"
            ${subqueryWhereClause}
            GROUP BY patient_id
        )
    `;

    const sql = `
        SELECT
            h.patient_id AS "PATIENT_ID",
            h.mr_no AS "MRNO",
            h.patient_name AS "PATIENT",
            h.bed_no AS "BED_NO",
            h.ward,
            h.bed_no,
            h.ward AS "SCNAME",
            h.doctor AS "DOCTOR",
            h.menu AS "MENU",
            h.menu_detail AS "NAME",
            to_char(h.order_date, 'DD-MM-YYYY HH24:MI') AS "ORDDATE",
            h.time_diff AS "dd",
            EXTRACT(EPOCH FROM (now() - h.order_date)) / 60 AS "DIFF",
            h.diet_type AS "DIETTYPE",
            to_char(h.admission_at, 'YYYY-MM-DD') AS "admdt",
            h.order_id AS "HINAIORDERID",
            h.status AS "ostatus",
            to_char(h.admission_at, 'DD-MM-YYYY HH24:MI') AS "ADMDATE",
            h.nursing_user,
            h.is_diet_change,
            h.is_transfer,
            CASE WHEN h.diet_type IN (17129492, 17129493, 17129495) THEN 'liquid' ELSE 'regular' END AS "dietorder",
            to_char(h.approved_date, 'DD-MM-YYYY HH24:MI') AS "approveddate"
        FROM "HinaiOrder" h
        ${whereClause}
        AND h.order_id IN (
            SELECT max(order_id) FROM "HinaiOrder"
            ${subqueryWhereClause}
            GROUP BY patient_id
        )
        ORDER BY h.order_id DESC
        LIMIT ${limit} OFFSET ${offset}
    `;

    const [totalResults, results] = await Promise.all([
        prisma.$queryRawUnsafe(countSql, ...params),
        prisma.$queryRawUnsafe(sql, ...params)
    ]);

    const total = Number(totalResults[0].count);

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: results.map(row => ({
            ...row,
            MRNO: row.MRNO ? row.MRNO.toString() : null,
            HINAIORDERID: row.HINAIORDERID ? Number(row.HINAIORDERID) : null,
            DIFF: Math.floor(row.DIFF || 0)
        }))
    };
};
