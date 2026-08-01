import prisma from '../../config/db.js';
import axios from 'axios';
import { getOracleConnection } from '../../config/oracleDb.js';
import oracledb from 'oracledb';
import { Prisma } from '@prisma/client';
import { formatDateTime } from '../../utils/dateUtils.js';
import authPrisma from '../../config/authDb.js';





const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL?.replace(/\/$/, '');

const createHttpError = (message, statusCode = 200) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const createNormalError = (message) => createHttpError(message, 200);
const createBadRequestError = (message) => createHttpError(message, 400);
const createForbiddenError = (message) => createHttpError(message, 403);
const createUnauthorizedError = (message) => createHttpError(message, 401);

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
    patient_status: true,
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
    plan_name: true,
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
            throw createNormalError(`${fieldName} is required`);
        }
        return null;
    }

    return String(value).trim();
};

const toIntValue = (value, fieldName, { required = true } = {}) => {
    if (value === undefined) {
        if (required) {
            throw createNormalError(`${fieldName} is required`);
        }
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        throw createNormalError(`${fieldName} must be a valid integer`);
    }

    return parsed;
};

const toBigIntValue = (value, fieldName, { required = true } = {}) => {
    if (value === undefined || value === null || value === '') {
        if (required) {
            throw createNormalError(`${fieldName} is required`);
        }
        return null;
    }

    try {
        return BigInt(value);
    } catch (error) {
        if (required) {
            throw createNormalError(`${fieldName} must be a valid bigint`);
        }
        return null;
    }
};

const toDateValue = (value, fieldName, { required = true } = {}) => {
    if (value === undefined) {
        if (required) {
            throw createNormalError(`${fieldName} is required`);
        }
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw createNormalError(`${fieldName} must be a valid date`);
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

const buildPatientPayload = (hinaiOrder) => ({
    mrn_no: hinaiOrder.mr_no?.toString() || '',
    patient_id: hinaiOrder.patient_id,
    patient_name: hinaiOrder.patient_name || '',
    mobile_no: hinaiOrder.mobile_no || '',
    email: hinaiOrder.email || '',
    doctor: hinaiOrder.doctor || '',
    age_gender: hinaiOrder.age_gender || '',
    bed_no: hinaiOrder.bed_no || '',
    admission_no: hinaiOrder.admission_no || '',
    admission_date: hinaiOrder.admission_at,
    ward: hinaiOrder.ward || '',
    menu_detail: hinaiOrder.menu_detail || '',
    menu_name: hinaiOrder.menu || '',
    hinai_order_id: hinaiOrder.order_id,
    plan_name: hinaiOrder.plan_name || '',
});

const buildOrderPayload = ({
    poId = null,
    dietType = null,
    nursingRemark = '',
    dietRemark = '',
    liquidHours,
}) => {
    const payload = {
        po_id: poId,
        diet_type: dietType,
        nursing_remark: nursingRemark,
        diet_remark: dietRemark,
    };

    if (liquidHours !== undefined) {
        payload.liquid_hours = liquidHours;
    }

    return payload;
};

const buildMenuItemPayload = ({
    menuId,
    description,
    patientMenuTimeId = null,
    checked,
    remarks = '',
    poId,
    dietRemark,
    printed,
}) => {
    const payload = {
        menu_id: menuId,
        description,
        patient_menu_time_id: patientMenuTimeId,
        remarks,
    };

    if (checked !== undefined) {
        payload.checked = checked;
    }

    if (poId !== undefined) {
        payload.po_id = poId;
    }

    if (dietRemark !== undefined) {
        payload.diet_remark = dietRemark;
    }

    if (printed !== undefined) {
        payload.printed = printed;
    }

    return payload;
};

const buildHinaiOrderListRow = ({
    row,
    po,
    username,
    orderDateLabel,
    admissionDateLabel,
    admissionDateOnly,
    approvedDateLabel,
}) => ({
    patient_id: row.patient_id,
    mrn_no: row.mr_no ? row.mr_no.toString() : null,
    patient_name: row.patient_name,
    bed_no: row.bed_no,
    ward: row.ward,
    doctor: row.doctor,
    menu_name: row.menu,
    menu_detail: row.menu_detail,
    order_date: row.order_date,
    order_date_label: orderDateLabel,
    diff: Math.floor((Date.now() - new Date(row.order_date)) / 60000),
    diet_type: row.diet_type,
    diet_name: po?.dietTypeData?.diet_name || '',
    hinai_order_id: row.order_id,
    admission_date: row.admission_at,
    admission_date_label: admissionDateLabel,
    admission_date_only: admissionDateOnly,
    approved_date: row.approved_date,
    approved_date_label: approvedDateLabel,
    nursing_user: row.nursing_user,
    is_diet_change: row.is_diet_change,
    is_transfer: row.is_transfer,
    diet_order: [17129492, 17129493, 17129495].includes(row.diet_type)
        ? 'liquid'
        : 'regular',
    po_id: po?.id || null,
    dispatched: po?.dispatched || false,
    is_cancelled: po?.is_cancelled || false,
    liquid_hours: po?.liquid_hours || 0,
    nursing_remark: po?.nursing_remark || row.nurse_remark || '',
    punch_date: po?.created_at || null,
    mail_flag: po?.mail_flag ?? 0,
    username,
    admission_no: row.admission_no || '',
    order_status: row.status ? 1 : 0,
    email: row.email || '',
    mobile_no: row.mobile_no || '',
    diagnosis: row.diagnosis || '',
    site_id: row.mst_id ? Number(row.mst_id) : null,
    out_time: row.out_time,
    clearance_time: row.clearance_time,
    clearance: row.clearance,
    patient_status: row.patient_status || '',
    plan_name: row.plan_name || '',
});

const buildLegacyHinaiOrderListRow = (row) => ({
    patient_id: row.PATIENT_ID,
    mrn_no: row.MRNO ? row.MRNO.toString() : null,
    patient_name: row.PATIENT,
    admission_no: row.ADMISSIONNUMBER,
    admission_date: row.ADMDATE,
    bed_no: row.BED_NO,
    ward: row.SCNAME,
    doctor: row.DOCTOR,
    menu_name: row.MENU,
    menu_detail: row.NAME,
    order_date: row.ORDDATE,
    diff: Math.floor(row.DIFF || 0),
    diet_type: row.DIETTYPE,
    hinai_order_id: row.HINAIORDERID ? Number(row.HINAIORDERID) : null,
    username: row.USERNAME,
    is_diet_change: row.ISDIETCHANGED,
    diagnosis: row.DIAGNOSIS,
    age_gender: row.AGEGENDER,
    mobile_no: row.MOBILENO,
    email: row.EMAIL,
    nurse_remark: row.NURSEREMARK,
    approved_date: row.APPROVEDDATE || row.approveddate,
    diet_order: row.dietorder,
    patient_status: row.PATIENTSTATUS || '',
});

const buildHinaiOrderDetailPayload = (orderDetails) => ({
    mrn_no: orderDetails.mr_no?.toString() || '',
    patient_id: orderDetails.patient_id,
    patient_name: orderDetails.patient_name || '',
    mobile_no: orderDetails.mobile_no || '',
    email: orderDetails.email || '',
    doctor: orderDetails.doctor || '',
    age_gender: orderDetails.age_gender || '',
    bed_no: orderDetails.bed_no || '',
    admission_no: orderDetails.admission_no || '',
    admission_date: orderDetails.admission_at,
    ward: orderDetails.ward || '',
    nurse_remark: orderDetails.nurse_remark?.toUpperCase() || '',
    menu_detail: orderDetails.menu_detail || '',
    created_at: orderDetails.created_at,
});

const LEGACY_REGULAR_STICKER_MENU_MAP = {
    '1': 'EM',
    '2': 'Breakfast',
    '3': 'MM',
    '4': 'Lunch',
    '5': '2PM',
    '6': 'EveTea',
    '7': '6PM',
    '8': 'Dinner',
};

export const resolveStickerMenuSelection = (rawMenuId, itemType = 'regular') => {
    if (rawMenuId === undefined || rawMenuId === null || rawMenuId === '') {
        return { mode: 'all', value: null };
    }

    const normalized = String(rawMenuId).trim();

    if (!normalized || normalized.toLowerCase() === 'all' || normalized === '0') {
        return { mode: 'all', value: null };
    }

    if (LEGACY_REGULAR_STICKER_MENU_MAP[normalized]) {
        return { mode: 'legacy_description', value: LEGACY_REGULAR_STICKER_MENU_MAP[normalized] };
    }

    return { mode: 'ptm_id', value: normalized };
};

const getAuditUserId = (jwtUser) => jwtUser?.userId ?? jwtUser?.id ?? null;

const getSiteListApiUrl = () => {
    if (!AUTH_SERVICE_URL) {
        throw createBadRequestError('AUTH_SERVICE_URL is not configured');
    }

    return AUTH_SERVICE_URL.endsWith('/api')
        ? `${AUTH_SERVICE_URL}/site/list`
        : `${AUTH_SERVICE_URL}/api/site/list`;
};
let siteListCache = null;
let siteListCacheTime = 0;
const SITE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let userMapCache = null;
let userMapCacheTime = 0;
const USER_MAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const fetchSiteList = async () => {
    const now = Date.now();
    if (siteListCache && (now - siteListCacheTime < SITE_CACHE_TTL)) {
        return siteListCache;
    }
    try {
        const apiResponse = await axios.get(getSiteListApiUrl());
        const siteList = Array.isArray(apiResponse.data?.data)
            ? apiResponse.data.data
            : [];
        siteListCache = siteList;
        siteListCacheTime = now;
        return siteList;
    } catch (error) {
        console.error('Error fetching site list from API:', error.message);
        if (siteListCache) {
            return siteListCache;
        }
        throw error;
    }
};

const getMstIdFromSiteId = async (siteId) => {
    if (siteId === undefined || siteId === null) {
        return null;
    }

    const parsedSiteId = toIntValue(siteId, 'site_id', { required: false });
    if (parsedSiteId === null) return null;

    const siteList = await fetchSiteList();

    const siteRecord = siteList.find(
        (site) => Number(site.site_id) === parsedSiteId
    );

    if (!siteRecord) {
        throw createNormalError(`No mst mapping found for site_id ${parsedSiteId}`);
    }

    return siteRecord.id; // mst_id
};

const getMstIdDirect = async (mstId) => {
    if (mstId === undefined || mstId === null) {
        return null;
    }

    const parsedMstId = toIntValue(mstId, 'mst_id', { required: false });
    if (parsedMstId === null) return null;

    const siteList = await fetchSiteList();

    const siteRecord = siteList.find(
        (site) => Number(site.id) === parsedMstId
    );

    if (!siteRecord) {
        throw createNormalError(`Invalid mst_id ${parsedMstId}`);
    }

    return siteRecord.id;
};

const getUserMap = async (siteId) => {
    const now = Date.now();
    if (userMapCache && (now - userMapCacheTime < USER_MAP_CACHE_TTL)) {
        return userMapCache;
    }
    try {
        const users = await authPrisma.$queryRaw`
            SELECT id, full_name as name, username FROM users
        `;
        const map = {};
        users.forEach((u) => {
            const id = String(u.id);
            map[id] = u.name || u.username;
        });
        userMapCache = map;
        userMapCacheTime = now;
        return map;
    } catch (error) {
        console.error('Error fetching user map from DB:', error.message);
        return userMapCache || {};
    }
};


const resolveSiteMapping = async (value, type = 'site_id') => {

    if (type === 'mst_id') {
        return await getMstIdDirect(value);
    }

    return await getMstIdFromSiteId(value);
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
    const planName = getFirstDefined(payload, ['plan_name', 'PLAN_NAME', 'planname']);
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
        plan_name: toStringValue(planName, 'plan_name', { required: false }),
    };
};

export const createHinaiOrder = async (body, jwtUser) => {
    const data = await mapHinaiOrderPayload(body);
    const auditUserId = getAuditUserId(jwtUser);

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

const toUpperTrimmed = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim().toUpperCase();
};

const parsePipeValueList = (value) => {
    if (value === undefined || value === null || value === '') {
        return [];
    }

    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim());
    }

    return String(value)
        .split('|')
        .map((item) => item.trim());
};

const REGULAR_EXCLUDED_DIET_TYPES = [18894123, 17129492, 17129493, 17129495];

const getOrderCategory = (dietType) =>
    Number(dietType) === 18894123 ? 'extra' : 'regular';

const mapPatientOrderItems = (body) => {
    if (Array.isArray(body.items) && body.items.length) {
        return body.items.map((item, index) => ({
            ptm_id: toStringValue(
                getFirstDefined(item, ['menu_id', 'ptm_id', 'ptmid', 'menu_time_id', 'id']),
                `items[${index}].ptm_id`
            ),
            remarks: toUpperTrimmed(
                getFirstDefined(item, ['remarks', 'item_remark', 'itemRemark'])
            ),
        }));
    }

    const ptmIds = parsePipeValueList(getFirstDefined(body, ['menu_ids']));
    const remarks = parsePipeValueList(getFirstDefined(body, ['ptrmrk', 'remarks']));

    if (!ptmIds.length) {
        return [];
    }

    return ptmIds.map((ptmId, index) => ({
        ptm_id: toStringValue(ptmId, `ptitm[${index}]`),
        remarks: toUpperTrimmed(remarks[index] || ''),
    }));
};

const getLatestActivePatientOrder = async (patientId, dietType) => {
    if (dietType === 18894123) {
        return prisma.patientOrder.findFirst({
            where: {
                patient_id: patientId,
                diet_type: 18894123,
                is_active: true,
            },
            orderBy: [
                { created_at: 'desc' },
                { updated_at: 'desc' },
            ],
        });
    }

    return prisma.patientOrder.findFirst({
        where: {
            patient_id: patientId,
            diet_type: {
                notIn: REGULAR_EXCLUDED_DIET_TYPES,
            },
            is_active: true,
        },
        orderBy: [
            { created_at: 'desc' },
            { updated_at: 'desc' },
        ],
    });
};

const getPatientOrderMenuTimes = async (dietType) => {
    const menuTimes = await prisma.menuTime.findMany({
        where: {
            is_active: true,
        },
        orderBy: {
            sort_order: 'asc'
        },
    });

    return dietType === 18894123 ? menuTimes.slice(0, 1) : menuTimes;
};

const LIQUID_FORM_DIET_TYPES = [17129492, 17129493, 17129495];

const getDefaultLiquidTimingCount = (hours) => {
    const map = {
        1: 19,
        2: 10,
        3: 7,
        4: 5,
        5: 4,
        6: 4,
        7: 3,
        8: 3,
        9: 3,
        10: 2,
        11: 2,
        12: 2,
    };

    return map[hours] || 0;
};

const buildDefaultLiquidTimings = (hours) => {
    const count = getDefaultLiquidTimingCount(hours);
    if (!count) {
        return [];
    }

    let offset = 0;

    return Array.from({ length: count }, () => {
        const liquidTime = 6 + offset;
        offset += hours;

        return {
            liquid_time: liquidTime,
            remarks: '',
        };
    });
};

const getLatestActiveLiquidOrder = async (patientId, liquidHours) => {
    return prisma.patientOrder.findFirst({
        where: {
            patient_id: patientId,
            liquid_hours: liquidHours,
            diet_type: {
                in: LIQUID_FORM_DIET_TYPES,
            },
            is_active: true,
        },
        orderBy: [
            { created_at: 'desc' },
            { updated_at: 'desc' },
        ],
        include: {
            patientOrderLiquids: {
                where: {
                    is_active: true,
                },
                orderBy: {
                    liquid_time: 'asc',
                },
            },
        },
    });
};

export const markHinaiOrderTransfer = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);
    const patientId = toIntValue(
        getFirstDefined(body, ['patient_id']),
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
        getFirstDefined(body, ['patient_id']),
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

export const createPatientOrder = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);

    const patientId = toIntValue(getFirstDefined(body, ['patient_id']), 'patient_id');
    const hinaiOrderId = toIntValue(getFirstDefined(body, ['hinai_order_id']), 'hinai_order_id');
    const existingPoId = getFirstDefined(body, ['po_id']);
    const dietType = toIntValue(getFirstDefined(body, ['diet_type']), 'diet_type');

    const dietRemark = toUpperTrimmed(getFirstDefined(body, ['diet_remark']));
    const nursingRemark = toUpperTrimmed(getFirstDefined(body, ['nursing_remark']));

    const items = mapPatientOrderItems(body);
    const orderCategory = getOrderCategory(dietType);

    if (!items.length) {
        throw new Error('At least one patient order item is required');
    }

    const hinaiOrder = await prisma.hinaiOrder.findFirst({
        where: {
            order_id: hinaiOrderId,
            patient_id: patientId,
            is_active: true,
        },
        select: {
            id: true,
            mst_id: true,
            order_id: true,
            patient_id: true,
        },
    });

    if (!hinaiOrder) {
        throw new Error('HINAI order not found for the given patient');
    }

    if (!existingPoId) {
        const duplicateWhere = {
            patient_id: patientId,
            hinai_order_id: hinaiOrderId,
            is_active: true,
            ...(orderCategory === 'extra'
                ? {
                    diet_type: 18894123,
                }
                : {
                    diet_type: {
                        not: 18894123,
                    },
                }),
        };

        const existingOrder = await prisma.patientOrder.findFirst({
            where: duplicateWhere,
            select: {
                id: true,
                hinai_order_id: true,
                diet_type: true,
            },
        });

        if (existingOrder) {
            throw new Error(
                `Patient order already exists for this hinai order and ${orderCategory} order type`
            );
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        let previousOrderId = null;

        if (existingPoId) {
            const previousOrder = await tx.patientOrder.findFirst({
                where: {
                    id: String(existingPoId),
                    patient_id: patientId,
                    is_active: true,
                },
                select: {
                    id: true,
                },
            });

            if (!previousOrder) {
                throw new Error('Existing patient order not found for update');
            }

            previousOrderId = previousOrder.id;

            await tx.patientOrder.update({
                where: {
                    id: previousOrder.id,
                },
                data: {
                    is_active: false,
                    updated_by: auditUserId ? String(auditUserId) : null,
                },
            });

            await tx.patientOrderDetail.updateMany({
                where: {
                    po_id: previousOrder.id,
                    is_active: true,
                },
                data: {
                    is_active: false,
                    updated_by: auditUserId ? String(auditUserId) : null,
                },
            });
        }

        const patientOrder = await tx.patientOrder.create({
            data: {
                patient_id: patientId,
                diet_type: dietType,
                nursing_remark: nursingRemark,
                diet_remark: dietRemark,
                dispatched: false,
                hinai_order_id: hinaiOrderId,
                is_cancelled: false,
                liquid_hours: Number(body.liquid_hours || 0),
                mst_id: hinaiOrder.mst_id,
                mail_flag: 0,
                created_by: auditUserId ? String(auditUserId) : null,
            },
            select: {
                id: true,
                patient_id: true,
                diet_type: true,
                hinai_order_id: true,
                created_at: true,
            },
        });

        await tx.patientOrderDetail.createMany({
            data: items.map((item) => ({
                po_id: patientOrder.id,
                ptm_id: String(item.ptm_id),
                item_id: 0,
                remarks: item.remarks,
                created_by: auditUserId ? String(auditUserId) : null,
            })),
        });

        await tx.hinaiOrder.update({
            where: {
                order_id: hinaiOrderId,
            },
            data: {
                status: true,
                updated_by: auditUserId ? String(auditUserId) : null,
            },
        });

        // Release edit lock if page_id is provided
        const pageId = getFirstDefined(body, ['page_id']);
        if (pageId) {
            await releasePageLock({ page_id: pageId, patient_id: patientId }, jwtUser);
        }

        return patientOrder;
    });

    return {
        po_id: result.id,
        patient_id: result.patient_id,
        hinai_order_id: result.hinai_order_id,
        diet_type: result.diet_type,
        item_count: items.length,
        nursing_remark: nursingRemark,
        diet_remark: dietRemark,
        created_at: result.created_at,
        mode: existingPoId ? 'edit' : 'add',
    };
};

export const getPatientOrderFormData = async (body, jwtUser) => {
    const patientId = toIntValue(getFirstDefined(body, ['patient_id']), 'patient_id');
    const hinaiOrderId = toIntValue(getFirstDefined(body, ['hinai_order_id']), 'hinai_order_id');
    const dietType = toIntValue(getFirstDefined(body, ['diet_type']), 'diet_type');
    const poId = getFirstDefined(body, ['po_id']);


    const hinaiOrder = await prisma.hinaiOrder.findFirst({
        where: {
            patient_id: patientId,
            order_id: hinaiOrderId,
            is_active: true,
        },
        select: {
            mr_no: true,
            patient_id: true,
            patient_name: true,
            mobile_no: true,
            email: true,
            doctor: true,
            age_gender: true,
            bed_no: true,
            admission_no: true,
            admission_at: true,
            ward: true,
            nurse_remark: true,
            menu_detail: true,
            menu: true,
            order_id: true,
        },
    });

    if (!hinaiOrder) {
        throw new Error('HINAI order not found');
    }

    let sourcePatientOrder = null;
    let mode = 'add';

    if (poId) {
        sourcePatientOrder = await prisma.patientOrder.findFirst({
            where: {
                id: String(poId),
                patient_id: patientId,
            },
            select: {
                id: true,
                diet_type: true,
                nursing_remark: true,
                diet_remark: true,
                created_at: true,
            },
        });

        if (!sourcePatientOrder) {
            throw new Error('Patient order not found for edit');
        }

        mode = 'edit';
    } else {
        sourcePatientOrder = await getLatestActivePatientOrder(patientId, dietType);
    }

    const menuTimes = await getPatientOrderMenuTimes(dietType);

    let details = [];
    if (sourcePatientOrder?.id) {
        details = await prisma.patientOrderDetail.findMany({
            where: {
                po_id: sourcePatientOrder.id,
                is_active: true,
            },
            select: {
                ptm_id: true,
                remarks: true,
            },
        });
    }

    const detailMap = new Map(details.map((detail) => [detail.ptm_id, detail]));

    let prefillNursingRemark = '';
    try {
        const nursingRemarks = await getNursingRemarks(
            {
                patient_id: patientId,
                order_id: hinaiOrderId,
            },
            jwtUser
        );

        prefillNursingRemark = nursingRemarks?.[0]?.nurse_remark || '';
    } catch (error) {
        prefillNursingRemark = hinaiOrder.nurse_remark || '';
    }

    return {
        mode,
        patient: buildPatientPayload(hinaiOrder),
        order: buildOrderPayload({
            poId: sourcePatientOrder?.id || null,
            dietType,
            nursingRemark:
                mode === 'edit'
                    ? sourcePatientOrder?.nursing_remark || ''
                    : toUpperTrimmed(prefillNursingRemark),
            dietRemark: sourcePatientOrder?.diet_remark || '',
        }),
        menu_items: menuTimes.map((menu) => {
            const detail = detailMap.get(menu.id);

            return buildMenuItemPayload({
                menuId: menu.id,
                description: menu.description,
                patientMenuTimeId: detail?.ptm_id || '0',
                checked: Boolean(detail?.ptm_id),
                remarks: detail?.remarks || '',
            });
        }),
    };
};

export const getHinaiOrdersOldAsRawQuery = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id']);
    const viewdata = getFirstDefined(body, ['view_data', 'viewdata']) || '0';
    const ordertype = getFirstDefined(body, ['order_type', 'ordertype']) || '0';
    const location = getFirstDefined(body, ['location']) || '';

    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = body.search || '';
    const offset = (page - 1) * limit;

    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) {
        throw new Error('Invalid site mapping');
    }

    const ctime = new Date().toISOString().split('T')[0];
    let whereConditions = [`mst_id = $1`, `is_discharge = false`];
    let subqueryWhere = [`mst_id = $1`];
    let params = [mstId];

    if (location && location !== 'all' && location !== '0') {
        let locationName = location;
        try {
            const loc = await prisma.location.findFirst({
                where: {
                    OR: [
                        { id: location },
                        { name: location }
                    ],
                    is_active: true
                }
            });
            if (loc) {
                locationName = loc.name;
            }
        } catch (err) {
            console.error('Location lookup error in getHinaiOrdersOldAsRawQuery:', err.message);
        }
        params.push(`%${locationName}%`);
        whereConditions.push(`h.ward ILIKE $${params.length}`);
    }

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
            h.patient_status AS "PATIENTSTATUS",
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
        data: results.map((row) => buildLegacyHinaiOrderListRow(row))
    };
};

export const checkPageLock = async (body, jwtUser) => {
    const pageId = toIntValue(getFirstDefined(body, ['page_id']), 'page_id');
    const patientId = toStringValue(getFirstDefined(body, ['patient_id']), 'patient_id');
    const userId = String(getAuditUserId(jwtUser));


    if (!userId) throw new Error('User identification required');

    const twoMinutesAgo = new Date(Date.now() - 2 * 60000);

    const existingLock = await prisma.currentlyEditing.findFirst({
        where: {
            page_id: pageId,
            po_id: patientId,
            timestamp: {
                gt: twoMinutesAgo,
            },
            is_active: true,
        },
    });

    if (existingLock && existingLock.user_id !== userId) {
        throw new Error('This page is already being edited by another user.');
    }

    // Delete any old locks for this page/patient to keep it clean
    await prisma.currentlyEditing.deleteMany({
        where: {
            page_id: pageId,
            po_id: patientId,
        },
    });

    const lock = await prisma.currentlyEditing.create({
        data: {
            page_id: pageId,
            po_id: patientId,
            user_id: userId,
            timestamp: new Date(),
        },
    });

    return { success: true, lock };
};

export const releasePageLock = async (body, jwtUser) => {
    const pageId = toIntValue(getFirstDefined(body, ['page_id']), 'page_id');
    const patientId = toStringValue(getFirstDefined(body, ['patient_id']), 'patient_id');
    const userId = String(getAuditUserId(jwtUser));

    await prisma.currentlyEditing.deleteMany({
        where: {
            page_id: pageId,
            po_id: patientId,
            user_id: userId,
        },
    });

    return { success: true };
};

export const getHinaiOrders = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id']);
    const viewdata = getFirstDefined(body, ['view_data', 'viewdata']) || 'today';
    const ordertype = getFirstDefined(body, ['order_type', 'ordertype']) || 'regular';
    // listType: 'hinai' = all HIS orders (hinaiviewlist.php), 'ordered' = only with PatientOrder (viewlist.php)
    const listType = getFirstDefined(body, ['list_type']) || 'hinai';
    const location = getFirstDefined(body, ['location']) || '';
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = body.search || '';
    const markDischarge = getFirstDefined(body, ['mark_discharge', 'markDischarge']) || '';
    const dischargeIntimation = getFirstDefined(body, ['discharge_intimation', 'dischargeIntimation']) || '';

    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let where = {
        mst_id: mstId,
        is_discharge: false
    };

    let andConditions = [];

    if (markDischarge || dischargeIntimation) {
        let statusConditions = [];
        if (markDischarge) {
            let cond = { patient_status: '388' };
            if (markDischarge === 'Cash') {
                cond.plan_name = 'Cash';
            } else if (markDischarge === 'TPA') {
                cond.plan_name = { not: 'Cash' };
            }
            statusConditions.push(cond);
        }
        if (dischargeIntimation) {
            let cond = { patient_status: { in: ['93706101', '93706103'] } };
            if (dischargeIntimation === 'Cash') {
                cond.plan_name = 'Cash';
            } else if (dischargeIntimation === 'TPA') {
                cond.plan_name = { not: 'Cash' };
            }
            statusConditions.push(cond);
        }
        if (statusConditions.length === 1) {
            andConditions.push(statusConditions[0]);
        } else if (statusConditions.length > 1) {
            andConditions.push({ OR: statusConditions });
        }
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    if (location && location !== 'all' && location !== '0') {
        let locationName = location;
        try {
            const loc = await prisma.location.findFirst({
                where: {
                    OR: [
                        { id: location },
                        { name: location }
                    ],
                    is_active: true
                }
            });
            if (loc) {
                locationName = loc.name;
            }
        } catch (err) {
            console.error('Location lookup error in getHinaiOrders:', err.message);
        }

        // where.ward = { contains: locationName, mode: 'insensitive' };
        where.ward = locationName;
    }

    /*
    ===========================================================
    listType = 'ordered' (viewlist.php / viewlistpunch.php)
    Filters on PatientOrder fields (diet_type, created_at)
    Only shows HinaiOrders that have a matching PatientOrder
    ===========================================================
    */
    if (listType === 'ordered') {
        const poFilter = {
            is_active: true,
            mst_id: BigInt(mstId)
        };

        if (ordertype === 'extra') {
            poFilter.diet_type = 18894123;
        } else if (ordertype === 'regular') {
            poFilter.diet_type = { not: 18894123 };
        }

        if (viewdata === 'today') {
            poFilter.created_at = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        where.patientOrders = { some: poFilter };
    }

    /*
    ===========================================================
    listType = 'hinai' (hinaiviewlist.php)
    Filters on HinaiOrder fields directly (menu, diet_type, order_date)
    Shows ALL HinaiOrders regardless of PatientOrder
    ===========================================================
    */
    if (listType === 'hinai') {
        if (ordertype === 'extra') {
            where.menu = 'EXTRA ORDER';
            where.diet_type = 18894123;
        } else if (ordertype === 'regular') {
            where.menu = { not: 'EXTRA ORDER' };
            where.diet_type = { not: 18894123 };
        }

        if (viewdata === 'today') {
            where.order_date = {
                gte: startOfDay,
                lte: endOfDay
            };
        }
    }

    // search
    if (search) {
        where.OR = [
            { patient_name: { contains: search, mode: 'insensitive' } },
            { mr_no: { equals: isNaN(search) ? undefined : BigInt(search) } },
            { bed_no: { contains: search, mode: 'insensitive' } },
            { ward: { contains: search, mode: 'insensitive' } },
            { doctor: { contains: search, mode: 'insensitive' } },
            { menu: { contains: search, mode: 'insensitive' } },
            { menu_detail: { contains: search, mode: 'insensitive' } }
        ];
    }

    // Build include for patientOrders
    const poIncludeWhere = listType === 'ordered'
        ? { is_active: true, mst_id: BigInt(mstId) }
        : { is_active: true };

    // Add diet/date filters to include when listType is 'ordered'
    if (listType === 'ordered') {
        if (ordertype === 'extra') {
            poIncludeWhere.diet_type = 18894123;
        } else if (ordertype === 'regular') {
            poIncludeWhere.diet_type = { not: 18894123 };
        }
        if (viewdata === 'today') {
            poIncludeWhere.created_at = { gte: startOfDay, lte: endOfDay };
        }
    }

    // fetch
    const rows = await prisma.hinaiOrder.findMany({
        where,
        orderBy: [
            { order_date: 'desc' }
        ],
        include: {
            patientOrders: {
                where: poIncludeWhere,
                orderBy: { created_at: 'desc' },
                take: 1,
                include: {
                    dietTypeData: true
                }
            }
        }
    });

    // 🔥 DISTINCT ON replacement (latest per patient)
    const map = new Map();
    for (const row of rows) {
        // For 'ordered' mode, skip rows without a matching PatientOrder
        if (listType === 'ordered' && !row.patientOrders?.length) continue;
        if (!map.has(row.patient_id)) {
            map.set(row.patient_id, row);
        }
    }
    const uniqueRows = Array.from(map.values());

    // Resolve usernames (created_by → name)
    const userMap = await getUserMap(mstId);

    // pagination AFTER grouping
    const total = uniqueRows.length;
    const paginated = uniqueRows.slice((page - 1) * limit, page * limit);

    const todayStr = new Date().toISOString().slice(0, 10);

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: paginated.map(row => {
            const po = row.patientOrders?.[0] || null;
            const createdBy = po?.created_by ? String(po.created_by) : null;
            const username = createdBy && userMap[createdBy] ? userMap[createdBy] : (createdBy || '');
            const admDt = row.admission_at
                ? new Date(row.admission_at).toISOString().slice(0, 10)
                : null;
            const ordDate = row.order_date
                ? new Date(row.order_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                : '';
            const approvedDate = row.approved_date
                ? new Date(row.approved_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                : '';
            const admDate = row.admission_at
                ? new Date(row.admission_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                : '';

            return buildHinaiOrderListRow({
                row,
                po,
                username,
                orderDateLabel: ordDate,
                admissionDateLabel: admDate,
                admissionDateOnly: admDt,
                approvedDateLabel: approvedDate,
            });
        })
    };
};

export const getPatientLiquidOrderFormData = async (body, jwtUser) => {
    const patientId = toIntValue(getFirstDefined(body, ['patient_id']), 'patient_id');
    const hinaiOrderId = toIntValue(getFirstDefined(body, ['hinai_order_id']), 'hinai_order_id');
    const dietType = toIntValue(getFirstDefined(body, ['diet_type']), 'diet_type');
    const poId = getFirstDefined(body, ['po_id']);


    const hinaiOrder = await prisma.hinaiOrder.findFirst({
        where: {
            patient_id: patientId,
            order_id: hinaiOrderId,
            is_active: true,
        },
        select: {
            mr_no: true,
            patient_id: true,
            patient_name: true,
            mobile_no: true,
            email: true,
            doctor: true,
            age_gender: true,
            bed_no: true,
            admission_no: true,
            admission_at: true,
            ward: true,
            nurse_remark: true,
            menu_detail: true,
            order_id: true,
        },
    });

    if (!hinaiOrder) {
        throw new Error('HINAI order not found');
    }

    let sourcePatientOrder = null;
    let timings = [];
    let mode = 'add';

    if (poId) {
        sourcePatientOrder = await prisma.patientOrder.findFirst({
            where: {
                id: String(poId),
                patient_id: patientId,
            },
            include: {
                patientOrderLiquids: {
                    where: {
                        is_active: true,
                    },
                    orderBy: {
                        liquid_time: 'asc',
                    },
                },
            },
        });

        if (!sourcePatientOrder) {
            throw new Error('Patient liquid order not found for edit');
        }

        timings = sourcePatientOrder.patientOrderLiquids.map((item) => ({
            liquid_time: item.liquid_time,
            remarks: item.remarks || '',
        }));
        mode = 'edit';
    } else {
        // Automatically find the latest active order if poId is not provided
        sourcePatientOrder = await prisma.patientOrder.findFirst({
            where: {
                patient_id: patientId,
                hinai_order_id: hinaiOrderId,
                is_active: true,
            },
            include: {
                patientOrderLiquids: {
                    where: {
                        is_active: true,
                    },
                    orderBy: {
                        liquid_time: 'asc',
                    },
                },
            },
        });

        if (sourcePatientOrder) {
            timings = sourcePatientOrder.patientOrderLiquids.map((item) => ({
                liquid_time: item.liquid_time,
                remarks: item.remarks || '',
            }));
            mode = 'edit';
        }
    }

    let prefillNursingRemark = '';
    try {
        const nursingRemarks = await getNursingRemarks(
            {
                patient_id: patientId,
                order_id: hinaiOrderId,
            },
            jwtUser
        );

        prefillNursingRemark = nursingRemarks?.[0]?.nurse_remark || '';
    } catch (error) {
        prefillNursingRemark = hinaiOrder.nurse_remark || '';
    }

    let latestDietRemark = '';
    const latestLiquidOrder = await prisma.patientOrder.findFirst({
        where: {
            patient_id: patientId,
            diet_type: {
                in: LIQUID_FORM_DIET_TYPES,
            },
            is_active: true,
        },
        orderBy: [
            { created_at: 'desc' },
            { updated_at: 'desc' },
        ],
        select: {
            diet_remark: true,
        },
    });

    latestDietRemark = latestLiquidOrder?.diet_remark || '';

    return {
        mode,
        patient: buildPatientPayload(hinaiOrder),
        order: buildOrderPayload({
            poId: sourcePatientOrder?.id || null,
            dietType,
            liquidHours: sourcePatientOrder?.liquid_hours || 0,
            nursingRemark:
                mode === 'edit'
                    ? sourcePatientOrder?.nursing_remark || ''
                    : toUpperTrimmed(prefillNursingRemark),
            dietRemark:
                mode === 'edit'
                    ? sourcePatientOrder?.diet_remark || ''
                    : latestDietRemark,
        }),
        timings,
    };
};

export const getPatientLiquidOrderTimings = async (body, jwtUser) => {
    const patientId = toIntValue(getFirstDefined(body, ['patient_id']), 'patient_id');
    const liquidHours = toIntValue(getFirstDefined(body, ['liquid_hours']), 'liquid_hours');

    if (liquidHours > 12) {
        throw new Error('Please do not add hours more than 12');
    }

    const latestLiquidOrder = await getLatestActiveLiquidOrder(
        patientId,
        liquidHours
    );

    if (latestLiquidOrder?.patientOrderLiquids?.length) {
        return {
            liquid_hours: latestLiquidOrder.liquid_hours,
            po_id: latestLiquidOrder.id,
            timings: latestLiquidOrder.patientOrderLiquids.map((item) => ({
                liquid_time: item.liquid_time,
                remarks: item.remarks || '',
            })),
        };
    }

    return {
        liquid_hours: liquidHours,
        po_id: null,
        timings: buildDefaultLiquidTimings(liquidHours),
    };
};

export const createPatientLiquidOrder = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);
    const patientId = toIntValue(getFirstDefined(body, ['patient_id']), 'patient_id');
    const hinaiOrderId = toIntValue(getFirstDefined(body, ['hinai_order_id']), 'hinai_order_id');
    const dietType = toIntValue(getFirstDefined(body, ['diet_type']), 'diet_type');
    const existingPoId = getFirstDefined(body, ['po_id']);
    const liquidHours = toIntValue(getFirstDefined(body, ['liquid_hours']), 'liquid_hours');
    const dietRemark = toUpperTrimmed(getFirstDefined(body, ['diet_remark']));
    const nursingRemark = toUpperTrimmed(getFirstDefined(body, ['nursing_remark']));

    const timingValues = parsePipeValueList(
        getFirstDefined(body, ['liquid_times'])
    );
    const timingRemarks = parsePipeValueList(
        getFirstDefined(body, ['liquid_remarks'])
    );

    const timings = Array.isArray(body.timings) && body.timings.length
        ? body.timings.map((item, index) => ({
            liquid_time: toIntValue(
                getFirstDefined(item, ['liquid_time']),
                `timings[${index}].liquid_time`
            ),
            remarks: toUpperTrimmed(getFirstDefined(item, ['remarks'])),
        }))
        : timingValues.map((time, index) => ({
            liquid_time: toIntValue(time, `liquid_times[${index}]`),
            remarks: toUpperTrimmed(timingRemarks[index] || ''),
        }));

    if (!timings.length) {
        throw new Error('At least one liquid timing is required');
    }

    const hinaiOrder = await prisma.hinaiOrder.findFirst({
        where: {
            order_id: hinaiOrderId,
            patient_id: patientId,
            is_active: true,
        },
        select: {
            mst_id: true,
            order_id: true,
            patient_id: true,
        },
    });

    if (!hinaiOrder) {
        throw new Error('HINAI order not found for the given patient');
    }

    if (!existingPoId) {
        const duplicateOrder = await prisma.patientOrder.findFirst({
            where: {
                patient_id: patientId,
                hinai_order_id: hinaiOrderId,
                diet_type: dietType,
                is_active: true,
            },
            select: {
                id: true,
            },
        });

        if (duplicateOrder) {
            throw new Error(
                'Patient liquid order already exists for this hinai order and diet type'
            );
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        if (existingPoId) {
            const previousOrder = await tx.patientOrder.findFirst({
                where: {
                    id: String(existingPoId),
                    patient_id: patientId,
                    is_active: true,
                },
                select: {
                    id: true,
                },
            });

            if (!previousOrder) {
                throw new Error('Existing patient liquid order not found for update');
            }

            await tx.patientOrder.update({
                where: {
                    id: previousOrder.id,
                },
                data: {
                    is_active: false,
                    updated_by: auditUserId ? String(auditUserId) : null,
                },
            });

            await tx.patientOrderLiquid.updateMany({
                where: {
                    po_id: previousOrder.id,
                    is_active: true,
                },
                data: {
                    is_active: false,
                    updated_by: auditUserId ? String(auditUserId) : null,
                },
            });
        }

        const patientOrder = await tx.patientOrder.create({
            data: {
                patient_id: patientId,
                diet_type: dietType,
                nursing_remark: nursingRemark,
                diet_remark: dietRemark,
                dispatched: false,
                hinai_order_id: hinaiOrderId,
                is_cancelled: false,
                liquid_hours: liquidHours,
                mst_id: hinaiOrder.mst_id,
                mail_flag: 0,
                created_by: auditUserId ? String(auditUserId) : null,
            },
            select: {
                id: true,
                patient_id: true,
                diet_type: true,
                hinai_order_id: true,
                liquid_hours: true,
                created_at: true,
            },
        });

        await tx.patientOrderLiquid.createMany({
            data: timings.map((item) => ({
                po_id: patientOrder.id,
                ptm_id: null,
                liquid_time: item.liquid_time,
                remarks: item.remarks,
                created_by: auditUserId ? String(auditUserId) : null,
            })),
        });

        await tx.hinaiOrder.update({
            where: {
                order_id: hinaiOrderId,
            },
            data: {
                status: true,
                updated_by: auditUserId ? String(auditUserId) : null,
            },
        });

        // Release edit lock if page_id is provided
        const pageId = getFirstDefined(body, ['page_id']);
        if (pageId) {
            await releasePageLock({ page_id: pageId, patient_id: patientId }, jwtUser);
        }

        return patientOrder;
    });

    return {
        po_id: result.id,
        patient_id: result.patient_id,
        hinai_order_id: result.hinai_order_id,
        diet_type: result.diet_type,
        liquid_hours: result.liquid_hours,
        timing_count: timings.length,
        nursing_remark: nursingRemark,
        diet_remark: dietRemark,
        created_at: result.created_at,
        mode: existingPoId ? 'edit' : 'add',
    };
};

export const refreshHinaiOrders = async () => {
    let connection;

    try {
        connection = await getOracleConnection();

        const ctime = new Date().toISOString().slice(0, 10);

        const sql = `
WITH cte AS (
    SELECT ip.ADMITTED_SITE ad_siteid, sc.site_id siteid, p.patient_id, p.mrno,
           pm2.prefix||' '||p.patientname AS PATIENT, ip.admissionnumber,
           ip.admissiondate admdate, b.bed_id, dl.bedno AS bed_no,
           sc.service_center_name scname,
           pm.prefix||' '||e.employee_name AS DOCTOR,
           dl.createddatetime cdate, dc.name, di.description,
           dl.diettiming AS diettype, dl.id hinaiorderid,
           h.username, dl.isdietchanged,
           prb.manual_entry_desc AS Diagnosis,
           FLOOR(MONTHS_BETWEEN(SYSDATE, p.dob)/12) ||
           (CASE p.ageunit WHEN 1 THEN ' Years' WHEN 2 THEN ' Months' ELSE ' Days' END) ||
           '/' || (CASE WHEN p.GENDERID = 1 THEN 'M' ELSE 'F' END) AS agegender,
           p.mobileno, p.email,
           dl.otherspecification nurseremark,
           ip.visit_patientstatus AS PATIENTSTATUS,
           TO_CHAR(dl.approveddate,'yyyy-mm-dd hh24:mi') AS approveddate,
           ip.plan_name AS plan_name
    FROM inpatients ip
    LEFT JOIN visit v ON v.visitid=ip.visitid
    LEFT JOIN problem prb ON prb.visitid=v.visitid
    LEFT JOIN patient p ON p.patient_id=ip.patient
    LEFT JOIN bed b ON b.bed_id=ip.bed
    LEFT JOIN employee e ON e.employee_id=ip.consultant
    LEFT JOIN prefix_master pm ON pm.id=e.emp_prefix
    LEFT JOIN prefix_master pm2 ON pm2.id=p.patprefix
    LEFT JOIN discharge d ON d.visit=v.visitid
    LEFT JOIN dietlaterequest dl ON dl.patient=p.patient_id
        AND dl.approvalstatus=2 AND dl.request_cancel_status<>2
    LEFT JOIN servicecenter sc ON sc.service_center_id=dl.servicecenter
    LEFT JOIN dietconfiguration dc ON dc.id = dl.dietprescription
    LEFT JOIN DIET_LATE_REQUESTDETAILITEM dlr ON dlr.dietlaterequest_detailid =dl.id
    LEFT JOIN DIETITEM di ON di.id = dlr.dietitemid
    LEFT JOIN hisuser h ON h.id=dl.createdby
    WHERE d.dateofdischarge IS NULL
      AND ip.visit_patientstatus<>1122
      AND dc.name IS NOT NULL
      AND dl.approveddate >= SYSDATE - INTERVAL '2' HOUR

    UNION

    SELECT ip.ADMITTED_SITE ad_siteid, sc.site_id siteid, p.patient_id, p.mrno,
           pm2.prefix||' '||p.patientname AS PATIENT, ip.admissionnumber,
           ip.admissiondate admdate, b.bed_id, b.bed_no,
           sc.service_center_name scname,
           pm.prefix||' '||e.employee_name AS DOCTOR,
           dr.createddatetime cdate, dc.name, di.description,
           dr.diettiming AS diettype, dq.id hinaiorderid,
           h.username, dq.isdietchanged,
           NULL AS Diagnosis,
           FLOOR(MONTHS_BETWEEN(SYSDATE, p.dob)/12) ||
           (CASE p.ageunit WHEN 1 THEN ' Years' WHEN 2 THEN ' Months' ELSE ' Days' END) ||
           '/' || (CASE WHEN p.GENDERID = 1 THEN 'M' ELSE 'F' END) AS agegender,
           p.mobileno, p.email,
           dietReqCo.comments nurseremark,
           ip.visit_patientstatus AS PATIENTSTATUS,
           TO_CHAR(NVL(dr.approveddatetime, dr.createddatetime),'yyyy-mm-dd hh24:mi') AS approveddate,
           ip.plan_name AS plan_name
    FROM inpatients ip
    LEFT JOIN visit v ON v.visitid=ip.visitid
    LEFT JOIN patient p ON p.patient_id=ip.patient
    LEFT JOIN bed b ON b.bed_id=ip.bed
    LEFT JOIN employee e ON e.employee_id=ip.consultant
    LEFT JOIN prefix_master pm ON pm.id=e.emp_prefix
    LEFT JOIN prefix_master pm2 ON pm2.id=p.patprefix
    LEFT JOIN discharge d ON d.visit=v.visitid
    LEFT JOIN DIETREQUESTDETAIL dq ON dq.patient=p.patient_id AND dq.request_cancel_status<>2
    INNER JOIN dietrequest dr ON dr.id=dq.drid
    LEFT JOIN servicecenter sc ON sc.service_center_id=dr.servicecenter
    LEFT JOIN dietconfiguration dc ON dc.id=dq.dietclassification
    LEFT JOIN DIETREQUESTDETAILITEM drd ON dq.id=drd.dietrequest_detailid
    LEFT JOIN DIETITEM di ON di.id=drd.dietitemid
    LEFT JOIN DIET_REQUEST_DETAIL_COMMENTS dietReqCo ON dietReqCo.DIET_REQUEST_DETAIL_ID = dq.id
    LEFT JOIN hisuser h ON h.id=dr.requestedby
    WHERE d.dateofdischarge IS NULL
      AND ip.visit_patientstatus<>1122
      AND drd.id IS NOT NULL
      AND dc.name IS NOT NULL
      AND dr.createddatetime >= SYSDATE - INTERVAL '24' HOUR
),
cte1 AS (
    SELECT ROW_NUMBER() OVER (PARTITION BY mrno,diettype ORDER BY cdate DESC) RN,
           ad_siteid, siteid, patient_id, mrno, PATIENT, admissionnumber,
           admdate, bed_id, bed_no, scname, DOCTOR,
           RTRIM(XMLAGG(XMLELEMENT(e, description || ', ')).EXTRACT('//text()'), ', ') AS NAME,
           name AS menu, cdate, diettype, hinaiorderid,
           username, isdietchanged, Diagnosis, agegender,
           mobileno, email, nurseremark, approveddate, plan_name
    FROM cte
    GROUP BY cdate, ad_siteid, siteid, patient_id, mrno, PATIENT,
             admissionnumber, admdate, bed_id, bed_no,
             scname, DOCTOR, name, diettype, hinaiorderid,
             username, isdietchanged, Diagnosis, agegender,
             mobileno, email, nurseremark, approveddate, plan_name
)
SELECT *
FROM cte1
WHERE rn = 1
  AND trunc(cdate) = trunc(SYSDATE)
`;

        const result = await connection.execute(
            sql,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        for (const row of result.rows) {
            const mappedSiteId = await resolveSiteMapping(
                row.SITEID, 'site_id'
            );

            await prisma.hinaiOrder.upsert({
                where: { order_id: Number(row.HINAIORDERID) },
                update: {
                    ward: row.SCNAME ? row.SCNAME.replace(/\s+/g, ' ').trim() : null,
                    bed_no: row.BED_NO,
                    is_transfer: false,
                    is_discharge: false,
                    plan_name: row.PLAN_NAME || null
                },
                create: {
                    mst_id: mappedSiteId,
                    patient_id: Number(row.PATIENT_ID),
                    mr_no: BigInt(row.MRNO),
                    patient_name: row.PATIENT,
                    admission_no: row.ADMISSIONNUMBER,
                    admission_at: new Date(row.ADMDATE),
                    bed_no: row.BED_NO,
                    ward: row.SCNAME ? row.SCNAME.replace(/\s+/g, ' ').trim() : null,
                    doctor: row.DOCTOR,
                    menu: row.MENU,
                    menu_detail: row.NAME,
                    order_date: new Date(row.CDATE),
                    time_diff: Number(row.DIFF || 0),
                    diet_type: Number(row.DIETTYPE),
                    order_id: Number(row.HINAIORDERID),
                    status: false,
                    is_discharge: false,
                    nursing_user: row.USERNAME,
                    is_diet_change: Boolean(row.ISDIETCHANGED),
                    is_transfer: false,
                    age_gender: row.AGEGENDER,
                    mobile_no: row.MOBILENO,
                    email: row.EMAIL,
                    nurse_remark: row.NURSEREMARK,
                    approved_date: row.APPROVEDDATE ? new Date(row.APPROVEDDATE) : null,
                    plan_name: row.PLAN_NAME || null,
                    created_by: row.USERNAME || null,
                    updated_by: row.USERNAME || null
                }
            });
        }

        // ===============================
        // 2. DISCHARGE QUERY
        // ===============================
        const dischargeResult = await connection.execute(
            `
      select pa.admissionno, pa.patientid
      from patientadmission pa
      inner join visit v on v.visitid=pa.visitid
      inner join inpatients ip on ip.visitid=v.visitid
      inner join discharge d on d.visit=v.visitid
      where d.dateofdischarge>=SYSDATE - INTERVAL '1' HOUR
      and d.dateofdischarge is not null
      `,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        for (const row of dischargeResult.rows) {
            await prisma.hinaiOrder.updateMany({
                where: {
                    admission_no: row.ADMISSIONNO,
                    patient_id: Number(row.PATIENTID)
                },
                data: {
                    is_discharge: true,
                    updated_at: new Date(),
                    updated_by: 'system'
                }
            });
        }

        // ===============================
        // 2.1 MARK FOR DISCHARGE CHECK
        // ===============================
        const markForDischargeResult = await connection.execute(
            `
            SELECT md.visitid,
                   ip.visit_patientstatus,
                   ip.admissionnumber
            FROM markfordischarge md
            INNER JOIN inpatients ip
                ON ip.visitid = md.visitid
            WHERE TRUNC(md.createddatetime) = TRUNC(SYSDATE)
            `,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        for (const row of markForDischargeResult.rows) {
            if (row.ADMISSIONNUMBER) {
                await prisma.hinaiOrder.updateMany({
                    where: {
                        admission_no: row.ADMISSIONNUMBER,
                        is_discharge: false
                    },
                    data: {
                        patient_status: row.VISIT_PATIENTSTATUS ? String(row.VISIT_PATIENTSTATUS) : null,
                        updated_at: new Date(),
                        updated_by: 'system'
                    }
                });
            }
        }

        // ===============================
        // 2.2 DISCHARGE INTIMATION CHECK
        // ===============================
        const dischargeIntimationResult = await connection.execute(
            `
            SELECT ip.admissionnumber, ip.visit_patientstatus
            FROM inpatients ip
            WHERE ip.discharge_intimated_date IS NOT NULL
              AND ip.visit_patientstatus IN (93706101, 93706103)
              AND TRUNC(ip.discharge_intimated_date) = TRUNC(SYSDATE)
            `,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        for (const row of dischargeIntimationResult.rows) {
            if (row.ADMISSIONNUMBER) {
                await prisma.hinaiOrder.updateMany({
                    where: {
                        admission_no: row.ADMISSIONNUMBER,
                        is_discharge: false
                    },
                    data: {
                        patient_status: row.VISIT_PATIENTSTATUS ? String(row.VISIT_PATIENTSTATUS) : null,
                        updated_at: new Date(),
                        updated_by: 'system'
                    }
                });
            }
        }



        // ===============================
        // 3. TRANSFER QUERY
        // ===============================
        const transferResult = await connection.execute(
            `
      select * from (
        select row_number() over(partition by from_patientid order by treq.transfer_id desc) trid,
               pat.patient_id,
               tosc.service_center_name as toWard,
               tob.bed_no as toBed
        from transferrequest treq
        inner join patient pat on pat.patient_id = treq.from_patientid
        left join bed tob on tob.bed_id = treq.to_bedid
        inner join servicecenter tosc on tosc.service_center_id=treq.servicecenter_id
        where to_char(treq.createddt,'yyyy-mm-dd') = :ctime
        and pat.patient_id<>396106
        and treq.to_bedid is not null
        and treq.request_status = 352
      ) where trid = 1
      `,
            { ctime },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        for (const row of transferResult.rows) {
            await prisma.hinaiOrder.updateMany({
                where: {
                    patient_id: Number(row.PATIENT_ID),
                    created_at: {
                        gte: new Date(`${ctime}T00:00:00.000Z`),
                        lte: new Date(`${ctime}T23:59:59.999Z`)
                    }
                },
                data: {
                    is_transfer: true,
                    bed_no: row.TOBED,
                    ward: row.TOWARD,
                    updated_at: new Date(),
                    updated_by: 'system'
                }
            });
        }

        return {
            status: true,
            message: "Hinai orders refreshed successfully"
        };

    } catch (err) {
        console.error(err);
        return {
            status: false,
            message: err.message
        };
    } finally {
        if (connection) await connection.close();
    }
};

export const getHinaiOrderSummary = async (body, jwtUser) => {

    const siteIdParam =
        getFirstDefined(body, ['site_id']) ||
        jwtUser?.siteID;
    if (!siteIdParam) {
        throw new Error('site id is required');
    }

    const viewdata = body.view_data || 'today';
    const ordertype = body.order_type || 'all';

    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');

    if (!mstId) {
        throw new Error('Invalid site mapping');
    }

    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let dateCondition = Prisma.empty;
    let orderTypeCondition = Prisma.empty;

    if (viewdata === 'today') {
        dateCondition = Prisma.sql`
            AND order_date >= ${startOfDay}
            AND order_date <= ${endOfDay}
        `;
    }
    if (ordertype === 'extra' && viewdata === 'today') {
        orderTypeCondition = Prisma.sql`
            AND menu = 'EXTRA ORDER'
        `;
    }

    const latestOrders = await prisma.$queryRaw`
        SELECT DISTINCT ON (patient_id)
            patient_id,
            order_id,
            menu,
            status
        FROM "HinaiOrder"
        WHERE
            mst_id = ${BigInt(mstId)}
            AND is_discharge = false
            AND is_active = true
            ${dateCondition}
            ${orderTypeCondition}
        ORDER BY patient_id, order_id DESC
    `;

    const total_orders = latestOrders.filter(
        x => x.menu !== 'EXTRA ORDER'
    ).length;

    const punched_orders = latestOrders.filter(
        x => x.menu !== 'EXTRA ORDER' && x.status === true
    ).length;

    const pending_order_punch = latestOrders.filter(
        x => x.menu !== 'EXTRA ORDER' && x.status === false
    ).length;

    const pending_extra_order_punch = latestOrders.filter(
        x => x.menu === 'EXTRA ORDER' && x.status === false
    ).length;

    return {
        total_orders,
        punched_orders,
        pending_order_punch,
        pending_extra_order_punch,
        totals: `Total Orders: ${total_orders} | Punched Orders: ${punched_orders}| Pending Order Punch: ${pending_order_punch}| Pending Extra Order Punch: ${pending_extra_order_punch}`
    };
};

export const getMenuDetails = async (body, jwtUser) => {
    try {

        const dietTypeValue = getFirstDefined(body, ['diet_type']);
        const hinaiOrderIdValue = getFirstDefined(body, ['hinai_order_id']);
        const patientIdValue = getFirstDefined(body, ['patient_id']);

        const dietType = toIntValue(dietTypeValue, 'diet_type');
        const hinaiOrderId = toIntValue(hinaiOrderIdValue, 'hinai_order_id');
        const patientId = toIntValue(patientIdValue, 'patient_id');

        if (!dietType || !hinaiOrderId || !patientId) {
            throw new Error('diet type, hinai order id and patient id are required');
        }

        /*
        ============================================================
        LATEST ORDER
        ============================================================
        */
        let latestPatientOrder = null;

        if (dietType === 18894123) {

            latestPatientOrder =
                await prisma.patientOrder.findFirst({
                    where: {
                        patient_id: patientId,
                        is_active: true,
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                });

        } else {

            latestPatientOrder =
                await prisma.patientOrder.findFirst({
                    where: {
                        patient_id: patientId,
                        diet_type: {
                            notIn: [18894123, 17129492, 17129493, 17129495,],
                        },
                        is_active: true,
                    },
                    orderBy: {
                        created_at: 'desc',
                    },
                });
        }

        /*
        ============================================================
        MENU TIMES
        ============================================================
        */
        const menuTimes = await prisma.menuTime.findMany({
            where: {
                is_active: true,
            },
            orderBy: {
                description: 'asc',
            },
        });

        /*
        ============================================================
        PATIENT ORDER DETAILS
        ============================================================
        */
        let patientOrderDetails = [];

        if (latestPatientOrder) {

            patientOrderDetails =
                await prisma.patientOrderDetail.findMany({
                    where: {
                        po_id: latestPatientOrder.id,
                        is_active: true,
                    },
                });
        }

        /*
        ============================================================
        RESPONSE
        ============================================================
        */
        const data = menuTimes.map((menu) => {

            const detail = patientOrderDetails.find(
                (d) => d.ptm_id === menu.id
            );

            return buildMenuItemPayload({
                menuId: menu.id,
                description: menu.description,
                patientMenuTimeId: detail?.ptm_id || null,
                remarks: detail?.remarks || '',
                poId: latestPatientOrder?.id || null,
                dietRemark: latestPatientOrder?.diet_remark || '',
            });
        });

        return data;

    } catch (error) {

        console.error('getMenuDetails error:', error);

        throw new Error(error.message);
    }
};

export const getHinaiOrderDetails = async (body, jwtUser) => {
    try {

        /*
        ===========================================================
        REQUEST VALUES
        ===========================================================
        */
        const patientId = Number(body.patient_id);
        const hinaiOrderId = Number(body.hinai_order_id);

        /*
        ===========================================================
        VALIDATION
        ===========================================================
        */
        if (!patientId || !hinaiOrderId) {
            throw new Error(
                'patient_id and hinai_order_id are required'
            );
        }

        /*
        ===========================================================
        SITE ID
        ===========================================================
        */
        const mstId =
            jwtUser?.mst_id ||
            jwtUser?.site_id ||
            jwtUser?.mstId;

        /*
        ===========================================================
        QUERY
        ===========================================================
        */
        const orderDetails =
            await prisma.hinaiOrder.findFirst({
                where: {
                    patient_id: patientId,
                    order_id: hinaiOrderId,
                    ...(mstId && {
                        mst_id: BigInt(mstId),
                    }),
                    is_active: true,
                },
                select: {
                    mr_no: true,
                    patient_id: true,
                    patient_name: true,
                    mobile_no: true,
                    email: true,
                    doctor: true,
                    age_gender: true,
                    bed_no: true,
                    admission_no: true,
                    admission_at: true,
                    ward: true,
                    nurse_remark: true,
                    menu_detail: true,
                    created_at: true,
                },
            });


        /*
        ===========================================================
        NO DATA
        ===========================================================
        */
        if (!orderDetails) {
            return {
                found: false,
            };
        }

        /*
        ===========================================================
        RESPONSE
        ===========================================================
        */
        return {
            found: true,
            ...buildHinaiOrderDetailPayload(orderDetails),
        };

    } catch (error) {
        console.error(
            'getHinaiOrderDetails error:',
            error
        );

        throw new Error(error.message);
    }
};

export const getNursingDeskDietDetails = async (body, jwtUser) => {
    const patientId = toIntValue(
        getFirstDefined(body, ['patient_id']),
        'patient_id'
    );
    const hinaiOrderId = toIntValue(
        getFirstDefined(body, ['hinai_order_id', 'poid']),
        'hinai_order_id'
    );
    const orderType = getFirstDefined(body, ['order_type', 'ordertype']) || 'regular';

    const hinaiOrder = await prisma.hinaiOrder.findFirst({
        where: {
            patient_id: patientId,
            order_id: hinaiOrderId,
            is_active: true
        },
        include: {
            patientOrders: {
                where: {
                    is_active: true
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: 1,
                include: {
                    patientOrderDetails: {
                        where: {
                            is_active: true
                        },
                        include: {
                            menuTime: true
                        },
                        orderBy: {
                            created_at: 'asc'
                        }
                    },
                    patientOrderLiquids: {
                        where: {
                            is_active: true
                        },
                        orderBy: {
                            liquid_time: 'asc'
                        }
                    }
                }
            }
        }
    });

    if (!hinaiOrder) {
        throw new Error('Order not found');
    }

    const patientOrder = hinaiOrder.patientOrders?.[0];

    if (!patientOrder) {
        return {
            res1: [
                {
                    dietRemark: ''
                }
            ],
            res2: []
        };
    }

    const isLiquidOrder =
        orderType === 'liquids' ||
        [17129492, 17129493, 17129495, 18894123].includes(patientOrder.diet_type);

    const res2 = isLiquidOrder
        ? patientOrder.patientOrderLiquids.map((item) => ({
            liqtime: item.liquid_time,
            remarks: item.remarks || ''
        }))
        : patientOrder.patientOrderDetails.map((item) => ({
            description: item.menuTime?.description || '',
            remarks: item.remarks || ''
        }));

    return {
        res1: [
            {
                dietRemark: patientOrder.diet_remark || ''
            }
        ],
        res2
    };
};

export const getNursingRemarks = async (body, jwtUser) => {
    let connection;

    try {
        const patientId = Number(body.patient_id);
        const hinaiOrderId = Number(body.hinai_order_id);

        if (!patientId || Number.isNaN(patientId)) {
            throw new Error('patient id is required and must be numeric');
        }

        if (!hinaiOrderId || Number.isNaN(hinaiOrderId)) {
            throw new Error('order id is required and must be numeric');
        }

        connection = await getOracleConnection();

        const sql = `
            select
                dl.patient as patient_id,
                dl.id as hinaiorderid,
                dl.otherspecification as nurse_remark
            from dietlaterequest dl
            where dl.patient = :patientId
                and dl.approvalstatus <> 3
                and dl.request_cancel_status <> 2
                and dl.id = :hinaiOrderId

            union

            select
                dq.patient as patient_id,
                dq.id as hinaiorderid,
                dietReqCo.comments as nurse_remark
            from DIETREQUESTDETAIL dq
            left join DIET_REQUEST_DETAIL_COMMENTS dietReqCo
                on dietReqCo.DIET_REQUEST_DETAIL_ID = dq.id
            where dq.patient = :patientId
                and dq.request_cancel_status <> 2
                and dq.id = :hinaiOrderId
        `;

        const result = await connection.execute(
            sql,
            {
                patientId,
                hinaiOrderId,
            },
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            }
        );

        const data = (result.rows || []).map((row) => ({
            patient_id: row.PATIENT_ID,
            hinai_order_id: row.HINAIORDERID,
            nurse_remark: row.NURSE_REMARK,
        }));

        return data;

    } catch (error) {
        console.error('getNursingRemarks service error:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Oracle connection close error:', err);
            }
        }
    }
};

export const updateDiagnosis = async (body, jwtUser) => {
    const mrNo = toStringValue(
        getFirstDefined(body, ['mr_no']),
        'mr_no'
    );
    const patientId = toIntValue(
        getFirstDefined(body, ['patient_id']),
        'patient_id'
    );
    const hinaiOrderId = toIntValue(
        getFirstDefined(body, ['hinai_order_id']),
        'hinai_order_id'
    );
    const newDiagnosisValue = toStringValue(
        getFirstDefined(body, [
            'new_diagnosis_value',
            'diagnosis',
        ]),
        'new_diagnosis_value'
    );
    const auditUserId = getAuditUserId(jwtUser);

    if (!newDiagnosisValue) {
        throw new Error('Diagnosis is required');
    }

    return await prisma.$transaction(async (tx) => {
        // Create diagnosis record
        const patientDiagnosis = await tx.patientDiagnosis.create({
            data: {
                mr_no: mrNo,
                patient_id: patientId,
                hinai_order_id: hinaiOrderId,
                diagnosis: newDiagnosisValue,
                created_by: auditUserId ? String(auditUserId) : null,
            },
        });

        // Update latest diagnosis in HinaiOrder
        await tx.hinaiOrder.updateMany({
            where: {
                order_id: hinaiOrderId,
                patient_id: patientId,
            },
            data: {
                diagnosis: newDiagnosisValue,
                updated_by: auditUserId ? String(auditUserId) : null,
            },
        });

        return patientDiagnosis;
    });
};

export const dispatchPatientOrder = async (body, jwtUser) => {
    const poId = toStringValue(
        getFirstDefined(body, ['po_id']),
        'po_id'
    );
    const auditUserId = getAuditUserId(jwtUser);

    // console.log('auditUserId', auditUserId);
    const result = await prisma.patientOrder.update({
        where: { id: poId },
        data: {
            dispatched: true,
            dispatched_by: auditUserId ? auditUserId : null,
            dispatched_at: new Date(),
        },
    });

    return result;
};

export const cancelPatientOrder = async (body, jwtUser) => {
    const poId = toStringValue(
        getFirstDefined(body, ['po_id']),
        'po_id'
    );
    const auditUserId = getAuditUserId(jwtUser);

    const result = await prisma.patientOrder.update({
        where: { id: poId },
        data: {
            is_cancelled: true,
            updated_by: auditUserId ? String(auditUserId) : null,
        },
    });
    return result;
};

export const outPatientOrder = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);
    const hinaiOrderId = getFirstDefined(body, ['hinai_order_id']);
    const remarks = toStringValue(getFirstDefined(body, ['remarks']), 'remarks', { required: false });

    const outTime = new Date().toLocaleString('en-GB', { hour12: false }).replace(',', ''); // Matching PHP format Y-m-d h:i:s or similar string

    if (!hinaiOrderId) {
        throw new Error('hinai_order_id is required');
    }

    const orderIds = parsePipeValueList(hinaiOrderId).map(id => toIntValue(id, 'order_id'));

    // Check already out-patient updated records
    const alreadyOutOrders = await prisma.hinaiOrder.findMany({
        where: {
            order_id: { in: orderIds },
            is_active: true,
            out_time: {
                not: null
            }
        },
        select: {
            order_id: true
        }
    });

    if (alreadyOutOrders.length > 0) {
        // throw new Error(`Selected hinai orders out: ${alreadyOutOrders.map(o => o.order_id).join(', ')}`);
        throw new Error(`Selected hinai orders already out`);
    }

    const result = await prisma.hinaiOrder.updateMany({
        where: {
            order_id: { in: orderIds },
            is_active: true
        },
        data: {
            out_time: outTime,
            out_by: auditUserId ? String(auditUserId) : null,
            remarks: remarks || null,
            updated_by: auditUserId ? String(auditUserId) : null,
        }
    });

    return {
        updated: result.count > 0,
        count: result.count,
        order_ids: orderIds
    };
};

export const clearPatientOrders = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);
    const hinaiOrderIds = getFirstDefined(body, ['hinai_order_ids']);

    const clearanceTime = new Date()
        .toLocaleString('en-GB', { hour12: false })
        .replace(',', '');

    if (!hinaiOrderIds) {
        throw new Error('hinai order ids is required');
    }

    const orderIds = parsePipeValueList(hinaiOrderIds).map(id =>
        toIntValue(id, 'order_id')
    );

    // Check already cleared orders
    const alreadyClearedOrders = await prisma.hinaiOrder.findMany({
        where: {
            order_id: { in: orderIds },
            clearance: true,
            is_active: true
        },
        select: {
            order_id: true
        }
    });

    if (alreadyClearedOrders.length > 0) {
        const clearedIds = alreadyClearedOrders.map(o => o.order_id);

        // throw new Error(`Selected hinai orders already cleared: ${clearedIds.join(', ')}`);
        throw new Error(`Selected hinai orders already cleared`);
    }

    const result = await prisma.hinaiOrder.updateMany({
        where: {
            order_id: { in: orderIds },
            is_active: true
        },
        data: {
            clearance: true,
            clearance_time: clearanceTime,
            clearance_by: auditUserId ? String(auditUserId) : null,
            updated_by: auditUserId ? String(auditUserId) : null,
        }
    });

    return {
        updated: result.count > 0,
        count: result.count,
        order_ids: orderIds
    };
};

export const getWards = async (body) => {
    const siteId = toIntValue(getFirstDefined(body, ['site_id']), 'site_id');

    const locations = await prisma.location.findMany({
        where: {
            mst_id: siteId,
            is_active: true
        },
        select: {
            name: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    return locations.map(l => l.name);
};

export const getMenus = async (body) => {
    const dietTypes = await prisma.dietType.findMany({
        where: {
            is_active: true,
            deleted_at: null
        },
        select: {
            diet_name: true
        },
        distinct: ['diet_name'],
        orderBy: {
            diet_name: 'asc'
        }
    });

    return dietTypes.map(d => d.diet_name).filter(Boolean);
};

export const getOrderMenuListWithPrintStatus = async (body) => {
    const patientId = toIntValue(getFirstDefined(body, ['patient_id']), 'patient_id');
    const dietType = toIntValue(getFirstDefined(body, ['diet_type']), 'diet_type');
    const poId = toIntValue(getFirstDefined(body, ['hinai_order_id']), 'hinai_order_id');
    const orderType = getFirstDefined(body, ['order_type']) || 'regular';


    let menuItems = [];

    if (orderType === 'extra') {
        const results = await prisma.$queryRaw`
            SELECT DISTINCT m.description, m.id as mid, COALESCE(sp.print_done, false) as printed
            FROM "PatientOrder" po
            LEFT JOIN "PatientOrderDetail" pd ON pd.po_id = po.id
            LEFT JOIN "MenuTime" m ON m.id = pd.ptm_id
            LEFT JOIN "StickerPrintStatus" sp ON sp.patient_id = po.patient_id
                AND sp.po_id = po.hinai_order_id
                AND sp.menu_time_id = 1
            WHERE po.patient_id = ${patientId} AND po.diet_type = ${dietType} AND po.hinai_order_id = ${poId} AND m.description = 'EM'
            ORDER BY m.id
        `;
        menuItems = results;
    } else if (orderType === 'regular') {
        const results = await prisma.$queryRaw`
            SELECT DISTINCT m.description, m.id as mid, COALESCE(sp.print_done, false) as printed
            FROM "PatientOrder" po
            LEFT JOIN "PatientOrderDetail" pd ON pd.po_id = po.id
            LEFT JOIN "MenuTime" m ON m.id = pd.ptm_id
            LEFT JOIN "StickerPrintStatus" sp ON sp.patient_id = po.patient_id
                AND sp.po_id = po.hinai_order_id
                AND sp.menu_time_id = (CASE m.description
                    WHEN 'Breakfast' THEN 2
                    WHEN 'MM' THEN 3
                    WHEN 'Lunch' THEN 4
                    WHEN '2PM' THEN 5
                    WHEN 'EveTea' THEN 6
                    WHEN '6PM' THEN 7
                    WHEN 'Dinner' THEN 8
                    ELSE 0 END)
            WHERE po.patient_id = ${patientId} AND po.diet_type = ${dietType} AND po.hinai_order_id = ${poId}
                AND m.description IN ('Breakfast', 'MM', 'Lunch', '2PM', 'EveTea', '6PM', 'Dinner')
            ORDER BY m.id
        `;
        menuItems = results;
    } else if (orderType === 'liquids') {
        const results = await prisma.$queryRaw`
            SELECT CAST(pd.liquid_time AS TEXT) as description, CAST(pd.id AS TEXT) as mid, COALESCE(sp.print_done, false) as printed
            FROM "PatientOrder" po
            LEFT JOIN "PatientOrderLiquid" pd ON pd.po_id = po.id
            LEFT JOIN "StickerPrintStatus" sp ON sp.patient_id = po.patient_id
                AND sp.po_id = po.hinai_order_id
                AND sp.menu_time_id = pd.liquid_time
            WHERE po.patient_id = ${patientId} AND po.hinai_order_id = ${poId}
        `;
        menuItems = results;
    }

    return menuItems.map((item) =>
        buildMenuItemPayload({
            menuId: item.mid,
            description: item.description,
            printed: item.printed,
        })
    );
};

const escapeCsvValue = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const downloadOrdersCsv = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id']) || jwtUser?.siteID;
    const itemType = body.item || body.order_type || 'regular';

    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let dietTypeFilter = Prisma.sql`AND po.diet_type <> 18894123`;
    let extraFields = Prisma.empty;

    if (itemType === 'extra') {
        dietTypeFilter = Prisma.sql`AND po.diet_type = 18894123`;
        extraFields = Prisma.sql`,
            LPAD(FLOOR(EXTRACT(EPOCH FROM (po.dispatched_at - ho.order_date)) / 3600)::text, 2, '0') || ':' || LPAD(FLOOR((EXTRACT(EPOCH FROM (po.dispatched_at - ho.order_date)) % 3600) / 60)::text, 2, '0') || ':' || LPAD(FLOOR(EXTRACT(EPOCH FROM (po.dispatched_at - ho.order_date)) % 60)::text, 2, '0') AS "OrdertoDispTAT",
            CASE
                WHEN COALESCE(po.dispatched, false) = true THEN 'Dispatched'
                WHEN COALESCE(po.is_cancelled, false) = true THEN 'Cancelled'
                WHEN COALESCE(po.dispatched, false) = false THEN 'Pending'
                ELSE ''
            END AS "Status"`;
    }

    const sql = Prisma.sql`
        SELECT
            ho.order_id AS "OrderID",
            ho.mr_no AS "MRNO",
            ho.patient_name AS "PatientName",
            CONCAT(ho.bed_no, '/', ho.ward) AS "Bed-Ward",
            ho.doctor AS "Doctor",
            dt.diet_name AS "DietType",
            pd_agg.menu_detail AS "MenuType:Remarks",
            po.nursing_remark AS "NurseRemark",
            po.diet_remark AS "DietitianRemark",
            po.created_by AS "OrderPunchBy",
            TO_CHAR(po.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY HH24:MI') AS "OrderPunchTime",
            TO_CHAR(ho.order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY HH24:MI') AS "HISOrderTime",
            LPAD(
                FLOOR(EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) / 3600)::text,
                2,
                '0'
            ) || ':' ||
            LPAD(
                FLOOR((EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) % 3600) / 60)::text,
                2,
                '0'
            ) || ':' ||
            LPAD(
                FLOOR(EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) % 60)::text,
                2,
                '0'
            ) AS "OrdertoPunchTAT"
            ${extraFields}
        FROM "PatientOrder" po
        LEFT JOIN "HinaiOrder" ho ON ho.order_id = po.hinai_order_id
        LEFT JOIN "DietType" dt ON dt.diet_type_id = po.diet_type
        LEFT JOIN (
            SELECT
                pd.po_id,
                STRING_AGG(
                    CASE
                        WHEN pd.remarks IS NOT NULL AND TRIM(pd.remarks) <> ''
                        THEN CONCAT(m.description, ': ', pd.remarks)
                        ELSE m.description
                    END,
                    ', '
                    ORDER BY m.sort_order
                ) AS menu_detail
            FROM "PatientOrderDetail" pd
            JOIN "MenuTime" m ON pd.ptm_id = m.id
            WHERE pd.is_active = true
            GROUP BY pd.po_id
        ) pd_agg ON pd_agg.po_id = po.id
        WHERE po.is_active = true
            AND po.mst_id = ${BigInt(mstId)}
            AND po.created_at >= ${startOfDay}
            AND po.created_at <= ${endOfDay}
            ${dietTypeFilter}
        ORDER BY
            ho.order_date DESC
    `;

    const results = await prisma.$queryRaw(sql);

    if (!results.length) return null;

    const userMap = await getUserMap(mstId);

    const headers = Object.keys(results[0]);
    const csvRows = [
        headers.join(','),
        ...results.map((row) => {
            if (row['OrderPunchBy'] && userMap[String(row['OrderPunchBy'])]) {
                row['OrderPunchBy'] = userMap[String(row['OrderPunchBy'])];
            }
            return headers.map((h) => escapeCsvValue(row[h])).join(',');
        }),
    ];

    return csvRows.join('\n');
};

export const downloadOutAllOrdersCsv = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id']) || jwtUser?.siteID;
    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const fromRaw = getFirstDefined(body, ['from_date', 'fromdate']);
    const toRaw = getFirstDefined(body, ['to_date', 'todate']);

    if (!fromRaw || !toRaw) throw new Error('from_date and to_date are required');

    const fromDate = parseInputDate(fromRaw);
    const toDate = parseInputDate(toRaw);

    if (!fromDate || !toDate) throw new Error('Invalid date format');

    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const sql = Prisma.sql`
        SELECT
            ho.order_id AS "OrderID",
            ho.mr_no AS "MRNO",
            ho.patient_name AS "PatientName",
            CONCAT(ho.bed_no, '/', ho.ward) AS "Bed-Ward",
            ho.doctor AS "Doctor",
            dt.diet_name AS "DietType",
            COALESCE(pd_agg.menu_detail, ho.menu_detail, ho.menu) AS "MenuType:Remarks",
            COALESCE(po.nursing_remark, ho.nurse_remark) AS "NurseRemark",
            po.diet_remark AS "DietitianRemark",
            po.created_by AS "OrderPunchBy",
            TO_CHAR(po.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY HH24:MI') AS "OrderPunchTime",
            TO_CHAR(ho.order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY HH24:MI') AS "HISOrderTime",
            LPAD(
                FLOOR(EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) / 3600)::text,
                2,
                '0'
            ) || ':' ||
            LPAD(
                FLOOR((EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) % 3600) / 60)::text,
                2,
                '0'
            ) || ':' ||
            LPAD(
                FLOOR(EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) % 60)::text,
                2,
                '0'
            ) AS "OrdertoPunchTAT",
            TO_CHAR(TO_TIMESTAMP(ho.out_time, 'DD/MM/YYYY HH24:MI:SS'), 'DD/MM/YYYY HH24:MI') AS "OutTime",
            LPAD(
                FLOOR(EXTRACT(EPOCH FROM (TO_TIMESTAMP(ho.out_time, 'DD/MM/YYYY HH24:MI:SS') - (ho.order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))) / 3600)::text,
                2,
                '0'
            ) || ':' ||
            LPAD(
                FLOOR((EXTRACT(EPOCH FROM (TO_TIMESTAMP(ho.out_time, 'DD/MM/YYYY HH24:MI:SS') - (ho.order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))) % 3600) / 60)::text,
                2,
                '0'
            ) || ':' ||
            LPAD(
                FLOOR(EXTRACT(EPOCH FROM (TO_TIMESTAMP(ho.out_time, 'DD/MM/YYYY HH24:MI:SS') - (ho.order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'))) % 60)::text,
                2,
                '0'
            ) AS "OrdertoOutTAT",
            ho.out_by AS "OutBy"
        FROM "HinaiOrder" ho
        LEFT JOIN "PatientOrder" po ON po.hinai_order_id = ho.order_id AND po.is_active = true
        LEFT JOIN "DietType" dt ON dt.diet_type_id = COALESCE(po.diet_type, ho.diet_type)
        LEFT JOIN (
            SELECT
                pd.po_id,
                STRING_AGG(
                    CASE
                        WHEN pd.remarks IS NOT NULL AND TRIM(pd.remarks) <> ''
                        THEN CONCAT(m.description, ': ', pd.remarks)
                        ELSE m.description
                    END,
                    ', '
                    ORDER BY m.sort_order
                ) AS menu_detail
            FROM "PatientOrderDetail" pd
            JOIN "MenuTime" m ON pd.ptm_id = m.id
            WHERE pd.is_active = true
            GROUP BY pd.po_id
        ) pd_agg ON pd_agg.po_id = po.id
        WHERE ho.is_active = true
          AND ho.mst_id = ${BigInt(mstId)}
          AND ho.out_time IS NOT NULL
          AND ho.out_time <> ''
          AND TO_DATE(ho.out_time, 'DD/MM/YYYY') >= ${fromDate}
          AND TO_DATE(ho.out_time, 'DD/MM/YYYY') <= ${toDate}
        ORDER BY
            ho.ward,
            ho.bed_no
    `;

    const results = await prisma.$queryRaw(sql);

    if (!results.length) return null;

    const userMap = await getUserMap(mstId);

    const headers = Object.keys(results[0]);
    const csvRows = [
        headers.join(','),
        ...results.map((row) => {
            if (row['OrderPunchBy'] && userMap[String(row['OrderPunchBy'])]) {
                row['OrderPunchBy'] = userMap[String(row['OrderPunchBy'])];
            }
            if (row['OutBy'] && userMap[String(row['OutBy'])]) {
                row['OutBy'] = userMap[String(row['OutBy'])];
            }
            if (row['MRNO']) {
                row['MRNO'] = String(row['MRNO']);
            }
            return headers.map((h) => escapeCsvValue(row[h])).join(',');
        }),
    ];

    return csvRows.join('\n');
};

export const getOutAllList = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id']) || jwtUser?.siteID;
    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const fromRaw = getFirstDefined(body, ['fromdate', 'from_date']);
    const toRaw = getFirstDefined(body, ['todate', 'to_date']);

    if (!fromRaw || !toRaw) throw new Error('fromdate and todate are required');

    const fromDate = parseInputDate(fromRaw);
    const toDate = parseInputDate(toRaw);

    if (!fromDate || !toDate) throw new Error('Invalid date format');

    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;

    const sql = Prisma.sql`
        SELECT DISTINCT ON (ho.mr_no)
            ho.patient_id,
            ho.mr_no,
            ho.patient_name,
            ho.doctor,
            ho.admission_no,
            ho.bed_no,
            ho.menu_detail,
            ho.out_time,
            ho.out_by
        FROM "HinaiOrder" ho
        WHERE ho.is_active = true
          AND ho.mst_id = ${BigInt(mstId)}
          AND ho.out_time IS NOT NULL
          AND ho.out_time <> ''
          AND TO_DATE(ho.out_time, 'DD/MM/YYYY') >= ${fromDate}
          AND TO_DATE(ho.out_time, 'DD/MM/YYYY') <= ${toDate}
        ORDER BY ho.mr_no, TO_TIMESTAMP(ho.out_time, 'DD/MM/YYYY HH24:MI:SS') DESC NULLS LAST
    `;

    const results = await prisma.$queryRaw(sql);

    const total = results.length;
    const isPaginated = limit !== -1;
    const paginated = isPaginated ? results.slice((page - 1) * limit, page * limit) : results;

    const userMap = await getUserMap(mstId);

    const mappedData = paginated.map((row) => ({
        patientid: row.patient_id,
        mrno: row.mr_no ? row.mr_no.toString() : '',
        patientname: row.patient_name,
        doctor: row.doctor,
        admno: row.admission_no,
        bedno: row.bed_no,
        menudetail: row.menu_detail,
        outby: userMap[String(row.out_by)] || row.out_by || '',
        outtime: row.out_time
    }));

    return {
        total,
        page,
        limit,
        totalPages: isPaginated ? Math.ceil(total / limit) : 1,
        data: mappedData
    };
};

const parseInputDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const str = String(dateStr).trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
    }
    if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return new Date(str);
            } else {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
        }
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
};

export const getClearanceList = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id']) || jwtUser?.siteID;
    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const fromRaw = getFirstDefined(body, ['fromdate', 'from_date']);
    const toRaw = getFirstDefined(body, ['todate', 'to_date']);

    if (!fromRaw || !toRaw) throw new Error('fromdate and todate are required');

    const fromDate = parseInputDate(fromRaw);
    const toDate = parseInputDate(toRaw);

    if (!fromDate || !toDate) throw new Error('Invalid date format');

    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;

    const sql = Prisma.sql`
        SELECT DISTINCT ON (ho.mr_no)
            ho.patient_id,
            ho.mr_no,
            ho.patient_name,
            ho.doctor,
            ho.admission_no,
            ho.bed_no,
            ho.menu_detail,
            ho.clearance_time,
            ho.clearance_by
        FROM "HinaiOrder" ho
        WHERE ho.is_active = true
          AND ho.clearance = true
          AND ho.mst_id = ${BigInt(mstId)}
          AND ho.clearance_time IS NOT NULL
          AND ho.clearance_time <> ''
          AND TO_DATE(ho.clearance_time, 'DD/MM/YYYY') >= ${fromDate}
          AND TO_DATE(ho.clearance_time, 'DD/MM/YYYY') <= ${toDate}
        ORDER BY ho.mr_no, TO_TIMESTAMP(ho.clearance_time, 'DD/MM/YYYY HH24:MI:SS') DESC NULLS LAST
    `;

    const results = await prisma.$queryRaw(sql);

    const total = results.length;
    const isPaginated = limit !== -1;
    const paginated = isPaginated ? results.slice((page - 1) * limit, page * limit) : results;

    const userMap = await getUserMap(mstId);

    const mappedData = paginated.map((row) => ({
        patientid: row.patient_id,
        mrno: row.mr_no ? row.mr_no.toString() : '',
        patientname: row.patient_name,
        doctor: row.doctor,
        admno: row.admission_no,
        bedno: row.bed_no,
        menudetail: row.menu_detail,
        Clearancetime: row.clearance_time,
        clearanceby: userMap[String(row.clearance_by)] || row.clearance_by || ''
    }));

    return {
        total,
        page,
        limit,
        totalPages: isPaginated ? Math.ceil(total / limit) : 1,
        data: mappedData
    };
};

export const downloadClearanceCsv = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id']) || jwtUser?.siteID;
    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const fromRaw = getFirstDefined(body, ['fromdate', 'from_date']);
    const toRaw = getFirstDefined(body, ['todate', 'to_date']);

    if (!fromRaw || !toRaw) throw new Error('fromdate and todate are required');

    const fromDate = parseInputDate(fromRaw);
    const toDate = parseInputDate(toRaw);

    if (!fromDate || !toDate) throw new Error('Invalid date format');

    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const sql = Prisma.sql`
        SELECT
            ho.order_id AS "OrderID",
            ho.mr_no AS "MRNO",
            ho.patient_name AS "PatientName",
            CONCAT(ho.bed_no, '/', ho.ward) AS "Bed-Ward",
            ho.doctor AS "Doctor",
            dt.diet_name AS "DietType",
            COALESCE(pd_agg.menu_detail, ho.menu_detail, ho.menu) AS "MenuType:Remarks",
            COALESCE(po.nursing_remark, ho.nurse_remark) AS "NurseRemark",
            po.diet_remark AS "DietitianRemark",
            po.created_by AS "OrderPunchBy",
            TO_CHAR(po.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY HH24:MI') AS "OrderPunchTime",
            TO_CHAR(ho.order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY HH24:MI') AS "HISOrderTime",
            LPAD(
                FLOOR(EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) / 3600)::text,
                2,
                '0'
            ) || ':' ||
            LPAD(
                FLOOR((EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) % 3600) / 60)::text,
                2,
                '0'
            ) || ':' ||
            LPAD(
                FLOOR(EXTRACT(EPOCH FROM (po.created_at - ho.order_date)) % 60)::text,
                2,
                '0'
            ) AS "OrdertoPunchTAT",
            TO_CHAR(TO_TIMESTAMP(ho.clearance_time, 'DD/MM/YYYY HH24:MI:SS'), 'DD/MM/YYYY HH24:MI') AS "ClearanceTime",
            ho.clearance_by AS "ClearanceBy"
        FROM "HinaiOrder" ho
        LEFT JOIN "PatientOrder" po ON po.hinai_order_id = ho.order_id AND po.is_active = true
        LEFT JOIN "DietType" dt ON dt.diet_type_id = COALESCE(po.diet_type, ho.diet_type)
        LEFT JOIN (
            SELECT
                pd.po_id,
                STRING_AGG(
                    CASE
                        WHEN pd.remarks IS NOT NULL AND TRIM(pd.remarks) <> ''
                        THEN CONCAT(m.description, ': ', pd.remarks)
                        ELSE m.description
                    END,
                    ', '
                    ORDER BY m.sort_order
                ) AS menu_detail
            FROM "PatientOrderDetail" pd
            JOIN "MenuTime" m ON pd.ptm_id = m.id
            WHERE pd.is_active = true
            GROUP BY pd.po_id
        ) pd_agg ON pd_agg.po_id = po.id
        WHERE ho.is_active = true
          AND ho.clearance = true
          AND ho.mst_id = ${BigInt(mstId)}
          AND ho.clearance_time IS NOT NULL
          AND ho.clearance_time <> ''
          AND TO_DATE(ho.clearance_time, 'DD/MM/YYYY') >= ${fromDate}
          AND TO_DATE(ho.clearance_time, 'DD/MM/YYYY') <= ${toDate}
        ORDER BY
            ho.ward,
            ho.bed_no
    `;

    const results = await prisma.$queryRaw(sql);

    if (!results.length) return null;

    const userMap = await getUserMap(mstId);

    const headers = Object.keys(results[0]);
    const csvRows = [
        headers.join(','),
        ...results.map((row) => {
            if (row['OrderPunchBy'] && userMap[String(row['OrderPunchBy'])]) {
                row['OrderPunchBy'] = userMap[String(row['OrderPunchBy'])];
            }
            if (row['ClearanceBy'] && userMap[String(row['ClearanceBy'])]) {
                row['ClearanceBy'] = userMap[String(row['ClearanceBy'])];
            }
            if (row['MRNO']) {
                row['MRNO'] = String(row['MRNO']);
            }
            return headers.map((h) => escapeCsvValue(row[h])).join(',');
        }),
    ];

    return csvRows.join('\n');
};

export const getPatientStickerData = async (body, jwtUser) => {
    const patientId = getFirstDefined(body, ['patient_id']);
    const orderId = getFirstDefined(body, ['hinai_order_id']);
    const menuId = getFirstDefined(body, ['menu_id']);
    const poid = getFirstDefined(body, ['po_id']);
    const dietType = getFirstDefined(body, ['diet_type']);

    const siteId = await resolveSiteMapping(getFirstDefined(body, ['site_id']) || jwtUser?.siteID, 'mst_id');

    const menuSelection = resolveStickerMenuSelection(menuId, 'regular');

    const poIdInt = orderId ? parseInt(orderId) : undefined;
    const patientIdInt = patientId ? parseInt(patientId) : undefined;

    const whereClause = {
        mst_id: BigInt(siteId)
    };

    if (patientIdInt && !isNaN(patientIdInt)) whereClause.patient_id = patientIdInt;
    if (poIdInt && !isNaN(poIdInt)) whereClause.order_id = poIdInt;

    const patientOrderFilter = { is_active: true };
    if (poid) {
        patientOrderFilter.id = poid;
    }
    if (dietType) {
        const dietTypeInt = parseInt(dietType);
        if (!isNaN(dietTypeInt)) {
            patientOrderFilter.diet_type = dietTypeInt;
        }
    }

    const patientOrderDetailsWhere = {};

    if (menuSelection.mode === 'ptm_id') {
        patientOrderDetailsWhere.ptm_id = String(menuSelection.value);
    } else if (menuSelection.mode === 'legacy_description') {
        patientOrderDetailsWhere.menuTime = {
            description: menuSelection.value
        };
    }

    const order = await prisma.hinaiOrder.findFirst({
        where: whereClause,
        include: {
            patientOrders: {
                where: patientOrderFilter,
                include: {
                    dietTypeData: true,
                    patientOrderDetails: {
                        where: patientOrderDetailsWhere,
                        include: { menuTime: true }
                    }
                }
            }
        }
    });

    if (!order || !order.patientOrders.length) throw new Error('Order not found');

    const po = order.patientOrders[0];
    const details = po.patientOrderDetails;

    if (!details.length) throw new Error('Menu detail not found for this sticker');

    const data = {
        mr_no: order.mr_no.toString(),
        patient_name: order.patient_name,
        doctor: order.doctor,
        admission_no: order.admission_no,
        bed_no: order.bed_no,
        ward: order.ward,
        diet_name: po.dietTypeData?.diet_name,
        menu_description: details[0].menuTime?.description,
        items: details.map(d => d.remarks ? `${d.menuTime.description}- ${d.remarks}` : d.menuTime.description).join(', '),
        nursing_remark: po.nursing_remark,
        diet_remark: po.diet_remark,
        order_date: formatDateTime(order.approved_date || order.order_date)
    };

    // Mark as printed
    await markStickerAsPrinted(patientIdInt, poIdInt, menuId);

    return data;
};

const markStickerAsPrinted = async (patientId, poId, menuId) => {
    try {
        const existing = await prisma.stickerPrintStatus.findFirst({
            where: {
                patient_id: patientId,
                po_id: poId,
                menu_time_id: menuId // Simplification for now
            }
        });

        if (existing) {
            await prisma.stickerPrintStatus.update({
                where: { id: existing.id },
                data: { print_done: true }
            });
        } else {
            await prisma.stickerPrintStatus.create({
                data: {
                    patient_id: patientId,
                    po_id: poId,
                    menu_time_id: menuId,
                    print_done: true
                }
            });
        }
    } catch (e) {
        console.error('Error marking sticker as printed:', e.message);
    }
};

export const getBulkStickerData = async (body, jwtUser) => {
    const siteId = await resolveSiteMapping(getFirstDefined(body, ['site_id']) || jwtUser?.siteID, 'mst_id');
    const menuId = getFirstDefined(body, ['menu_id']);
    const ward = body.ward;
    const itemType = body.item || body.order_type || 'regular';
    const markDischarge = getFirstDefined(body, ['mark_discharge', 'markDischarge']) || '';
    const dischargeIntimation = getFirstDefined(body, ['discharge_intimation', 'dischargeIntimation']) || '';
    const menuSelection = resolveStickerMenuSelection(menuId, itemType);

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const excludedDiets = [17154031, 17129492, 17129493, 18894123];
    const patientOrderWhere = {
        is_active: true,
        created_at: { gte: startOfDay, lte: endOfDay }
    };

    if (itemType === 'extra') {
        patientOrderWhere.diet_type = 18894123;
    } else {
        patientOrderWhere.diet_type = { notIn: excludedDiets };
    }

    if (menuSelection.mode === 'ptm_id') {
        patientOrderWhere.patientOrderDetails = {
            some: { ptm_id: String(menuSelection.value) }
        };
    } else if (menuSelection.mode === 'legacy_description') {
        patientOrderWhere.patientOrderDetails = {
            some: {
                menuTime: {
                    description: menuSelection.value
                }
            }
        };
    }

    const whereClause = {
        mst_id: BigInt(siteId),
        is_active: true,
        is_discharge: false,
        status: true,
        patientOrders: {
            some: patientOrderWhere
        }
    };

    if (ward) whereClause.ward = ward;

    let andConditions = [];
    if (markDischarge || dischargeIntimation) {
        let statusConditions = [];
        if (markDischarge) {
            let cond = { patient_status: '388' };
            if (markDischarge === 'Cash') {
                cond.plan_name = 'Cash';
            } else if (markDischarge === 'TPA') {
                cond.plan_name = { not: 'Cash' };
            }
            statusConditions.push(cond);
        }
        if (dischargeIntimation) {
            let cond = { patient_status: { in: ['93706101', '93706103'] } };
            if (dischargeIntimation === 'Cash') {
                cond.plan_name = 'Cash';
            } else if (dischargeIntimation === 'TPA') {
                cond.plan_name = { not: 'Cash' };
            }
            statusConditions.push(cond);
        }
        if (statusConditions.length === 1) {
            andConditions.push(statusConditions[0]);
        } else if (statusConditions.length > 1) {
            andConditions.push({ OR: statusConditions });
        }
    }

    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    const orders = await prisma.hinaiOrder.findMany({
        where: whereClause,
        include: {
            patientOrders: {
                where: patientOrderWhere,
                orderBy: { created_at: 'desc' },
                take: 1,
                include: {
                    dietTypeData: true,
                    patientOrderDetails: {
                        include: { menuTime: true }
                    }
                }
            }
        },
        orderBy: [{ ward: 'asc' }, { bed_no: 'asc' }]
    });

    const result = [];
    for (const order of orders) {
        const po = order.patientOrders[0];
        const details = menuSelection.mode === 'ptm_id'
            ? po.patientOrderDetails.filter((d) => d.ptm_id === String(menuSelection.value))
            : menuSelection.mode === 'legacy_description'
                ? po.patientOrderDetails.filter((d) => d.menuTime?.description === menuSelection.value)
                : po.patientOrderDetails;

        if (details.length === 0) continue;

        result.push({
            mr_no: order.mr_no.toString(),
            patient_name: order.patient_name,
            doctor: order.doctor,
            admission_no: order.admission_no,
            bed_no: order.bed_no,
            ward: order.ward,
            diet_name: po.dietTypeData?.diet_name,
            menu_description: details[0].menuTime?.description,
            items: details.map(d => d.remarks ? `${d.menuTime.description}- ${d.remarks}` : d.menuTime.description).join(', '),
            nursing_remark: po.nursing_remark,
            diet_remark: po.diet_remark,
            order_date: formatDateTime(order.approved_date || order.order_date)
        });

        await markStickerAsPrinted(order.patient_id, order.order_id, menuId);
    }

    return result;
};

export const getLiquidStickerData = async (body, jwtUser) => {
    const siteId = await resolveSiteMapping(getFirstDefined(body, ['site_id']) || jwtUser?.siteID, 'mst_id');
    const menuId = getFirstDefined(body, ['menu_id']);
    const ward = body.ward;
    const markDischarge = getFirstDefined(body, ['mark_discharge', 'markDischarge']) || '';
    const dischargeIntimation = getFirstDefined(body, ['discharge_intimation', 'dischargeIntimation']) || '';

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause = {
        mst_id: BigInt(siteId),
        is_active: true,
        is_discharge: false,
        patientOrders: {
            some: {
                is_active: true,
                created_at: { gte: startOfDay, lte: endOfDay },
                patientOrderLiquids: menuId ? { some: { liquid_time: parseInt(menuId) } } : { some: {} }
            }
        }
    };

    if (ward) whereClause.ward = ward;

    let andConditions = [];
    if (markDischarge || dischargeIntimation) {
        let statusConditions = [];
        if (markDischarge) {
            let cond = { patient_status: '388' };
            if (markDischarge === 'Cash') {
                cond.plan_name = 'Cash';
            } else if (markDischarge === 'TPA') {
                cond.plan_name = { not: 'Cash' };
            }
            statusConditions.push(cond);
        }
        if (dischargeIntimation) {
            let cond = { patient_status: { in: ['93706101', '93706103'] } };
            if (dischargeIntimation === 'Cash') {
                cond.plan_name = 'Cash';
            } else if (dischargeIntimation === 'TPA') {
                cond.plan_name = { not: 'Cash' };
            }
            statusConditions.push(cond);
        }
        if (statusConditions.length === 1) {
            andConditions.push(statusConditions[0]);
        } else if (statusConditions.length > 1) {
            andConditions.push({ OR: statusConditions });
        }
    }

    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    const orders = await prisma.hinaiOrder.findMany({
        where: whereClause,
        include: {
            patientOrders: {
                where: {
                    is_active: true,
                    created_at: { gte: startOfDay, lte: endOfDay }
                },
                orderBy: { created_at: 'desc' },
                take: 1,
                include: {
                    patientOrderLiquids: menuId ? { where: { liquid_time: parseInt(menuId) } } : true
                }
            }
        },
        orderBy: [{ ward: 'asc' }, { bed_no: 'asc' }]
    });

    const result = [];
    for (const order of orders) {
        const po = order.patientOrders[0];
        for (const liq of po.patientOrderLiquids) {
            result.push({
                mr_no: order.mr_no.toString(),
                patient_name: order.patient_name,
                bed_no: order.bed_no,
                ward: order.ward,
                menu_detail: order.menu_detail,
                description: liq.liquid_time.toString(),
                remarks: liq.remarks,
                nursing_remark: po.nursing_remark,
                diet_remark: po.diet_remark,
                order_date: formatDateTime(order.order_date)
            });
        }
    }

    return result;
};

export const checkLatestHinaiOrders = async (body, jwtUser) => {
    try {

        /*
        ===========================================================
        REQUEST VALUES
        ===========================================================
        */
        const viewdata = getFirstDefined(body, ['view_data', 'viewdata']) || 'all';
        const ordertype = getFirstDefined(body, ['order_type', 'ordertype']) || 'regular';

        /*
        ===========================================================
        SITE ID
        ===========================================================
        */
        const siteIdParam = getFirstDefined(body, ['site_id', 'siteid', 'SITEID']) || jwtUser?.site_id || jwtUser?.mst_id;

        if (!siteIdParam) {
            throw new Error('site id is required');
        }

        /*
        ===========================================================
        MST ID
        ===========================================================
        */
        const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');

        if (!mstId) {
            throw new Error('Invalid site mapping');
        }

        /*
        ===========================================================
        DATE FILTER
        ===========================================================
        */
        const now = new Date();

        const tenSecondsAgo = new Date(now.getTime() - 10000);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        /*
        ===========================================================
        WHERE CONDITION
        ===========================================================
        */
        const where = {
            mst_id: BigInt(mstId),
            is_discharge: false,
            created_at: { gte: tenSecondsAgo },
            is_active: true,
        };

        /*
        ===========================================================
        ORDER TYPE FILTER
        ===========================================================
        */
        if (ordertype === 'extra') {
            where.menu = 'EXTRA ORDER';
        } else if (ordertype === 'regular') {
            where.menu = { not: 'EXTRA ORDER' };
        }

        /*
        ===========================================================
        VIEW DATA FILTER
        ===========================================================
        */
        if (viewdata === 'today') {
            where.order_date = { gte: startOfDay, lte: endOfDay };
        }

        /*
        ===========================================================
        CHECK EXISTS
        ===========================================================
        */
        const latestOrder = await prisma.hinaiOrder.findFirst({
            where,
            select: { id: true },
            orderBy: { created_at: 'desc' },
        });

        /*
        ===========================================================
        RESPONSE
        ===========================================================
        */
        return { has_value: !!latestOrder };

    } catch (error) {

        console.error('check Latest HinaiOrders service error:', error);
        throw new Error(error.message);
    }
};

export const getLastOrder = async (body, jwtUser) => {
    const mrnoStr = getFirstDefined(body, ['mrno', 'mr_no']);
    if (!mrnoStr) throw new Error('mrno is required');
    const mrNo = BigInt(mrnoStr);

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.hinaiOrder.findMany({
        where: {
            mr_no: mrNo,
            status: true, // ostatus = 1
            created_at: { gte: startOfDay, lte: endOfDay }
        },
        orderBy: { id: 'desc' }
    });

    let siteList = [];
    try {
        siteList = await fetchSiteList();
    } catch (err) {
        console.error('Failed to fetch site list for getLastOrder:', err.message);
    }

    return orders.map(order => {
        const siteRecord = siteList.find(s => Number(s.id) === Number(order.mst_id));
        return {
            id: order.id,
            site_id: order.mst_id ? order.mst_id.toString() : '',
            hinai_site_id: siteRecord ? siteRecord.site_id : '',
            site_name: siteRecord ? siteRecord.site_name : '',
            patient_id: order.patient_id,
            mr_no: order.mr_no.toString(),
            patient_name: order.patient_name,
            doctor: order.doctor,
            admission_no: order.admission_no,
            bed_no: order.bed_no,
            ward: order.ward,
            menu: order.menu,
            menu_detail: order.menu_detail,
            order_date: order.order_date ? new Date(order.order_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '') : '',
            nurse_remark: order.nurse_remark || '',
            diet_remark: order.diet_remark || '',
            order_time: order.order_time || ''
        };
    });
};

export const updateSiteId = async (body, jwtUser) => {
    const id = getFirstDefined(body, ['id']);
    const mrnoStr = getFirstDefined(body, ['mrno', 'mr_no']);
    if (!id || !mrnoStr) throw new Error('id and mrno are required');
    const mrNo = BigInt(mrnoStr);

    const siteIdParam = getFirstDefined(body, ['site_id']) || jwtUser?.siteID;
    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Update HinaiOrder
    const result = await prisma.hinaiOrder.updateMany({
        where: {
            id: id,
            mr_no: mrNo,
            created_at: { gte: startOfDay, lte: endOfDay }
        },
        data: {
            mst_id: BigInt(mstId)
        }
    });

    if (result.count === 0) {
        throw new Error('Record not found or already updated');
    }

    // Return the updated order list
    return await getLastOrder(body, jwtUser);
};

export const getLastPunchOrder = async (body, jwtUser) => {
    const mrnoStr = getFirstDefined(body, ['mrno', 'mr_no']);
    if (!mrnoStr) throw new Error('mrno is required');
    const mrNo = BigInt(mrnoStr);

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    let siteList = [];
    try {
        siteList = await fetchSiteList();
    } catch (err) {
        console.error('Failed to fetch site list for getLastOrder:', err.message);
    }
    const patientOrders = await prisma.patientOrder.findMany({
        where: {
            is_active: true,
            created_at: { gte: startOfDay, lte: endOfDay },
            hinaiOrder: {
                mr_no: mrNo
            }
        },
        include: {
            hinaiOrder: true
        },
        orderBy: { id: 'desc' }
    });

    return patientOrders.map(po => {
        const ho = po.hinaiOrder;
        const mstId = po.mst_id || ho?.mst_id;
        const siteRecord = siteList.find(s => Number(s.id) === Number(mstId));

        return {
            id: po.id,
            site_id: mstId ? mstId.toString() : '',
            hinai_site_id: siteRecord ? siteRecord.site_id : '',
            site_name: siteRecord ? siteRecord.site_name : '',
            patient_id: po.patient_id,
            mrno: ho.mr_no.toString(),
            patient_name: ho.patient_name,
            doctor: ho.doctor,
            admission_no: ho.admission_no,
            bed_no: ho.bed_no,
            ward: ho.ward,
            menu: ho.menu,
            menu_detail: ho.menu_detail,
            order_date: ho.order_date ? new Date(ho.order_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '') : '',
            diet_remark: po.diet_remark || ''
        };
    });
};

export const updatePOSiteId = async (body, jwtUser) => {
    const id = getFirstDefined(body, ['id']);
    const mrnoStr = getFirstDefined(body, ['mrno', 'mr_no']);
    if (!id || !mrnoStr) throw new Error('id and mrno are required');
    const mrNo = BigInt(mrnoStr);

    const siteIdParam = getFirstDefined(body, ['site_id']) || jwtUser?.siteID;
    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Update PatientOrder
    const result = await prisma.patientOrder.updateMany({
        where: {
            id: id,
            created_at: { gte: startOfDay, lte: endOfDay }
        },
        data: {
            mst_id: BigInt(mstId)
        }
    });

    if (result.count === 0) {
        throw new Error('Record not found or already updated');
    }

    // Return the updated order list (using getLastOrder per PHP logic)
    return await getLastOrder(body, jwtUser);
};
