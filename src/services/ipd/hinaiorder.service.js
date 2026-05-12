import prisma from '../../config/db.js';
import axios from 'axios';
import { getOracleConnection } from '../../config/oracleDb.js';
import oracledb from 'oracledb';
import { Prisma } from '@prisma/client';

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

const getMstIdFromSiteId = async (siteId) => {
    if (siteId === undefined || siteId === null) {
        return null;
    }

    const parsedSiteId = toIntValue(siteId, 'site_id', { required: false });
    if (parsedSiteId === null) return null;

    const apiResponse = await axios.get(getSiteListApiUrl());

    const siteList = Array.isArray(apiResponse.data?.data)
        ? apiResponse.data.data
        : [];

    const siteRecord = siteList.find(
        (site) => Number(site.site_id) === parsedSiteId
    );

    if (!siteRecord) {
        throw new Error(`No mst mapping found for site_id ${parsedSiteId}`);
    }

    return siteRecord.id; // mst_id
};

const getMstIdDirect = async (mstId) => {
    if (mstId === undefined || mstId === null) {
        return null;
    }

    const parsedMstId = toIntValue(mstId, 'mst_id', { required: false });
    if (parsedMstId === null) return null;

    const apiResponse = await axios.get(getSiteListApiUrl());

    const siteList = Array.isArray(apiResponse.data?.data)
        ? apiResponse.data.data
        : [];

    const siteRecord = siteList.find(
        (site) => Number(site.id) === parsedMstId
    );

    if (!siteRecord) {
        throw new Error(`Invalid mst_id ${parsedMstId}`);
    }

    return siteRecord.id;
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
                getFirstDefined(item, ['ptm_id', 'ptmid', 'menu_time_id', 'id']),
                `items[${index}].ptm_id`
            ),
            remarks: toUpperTrimmed(
                getFirstDefined(item, ['remarks', 'item_remark', 'itemRemark'])
            ),
        }));
    }

    const ptmIds = parsePipeValueList(getFirstDefined(body, ['ptitm', 'ptmids']));
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
            description: 'asc',
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

export const createPatientOrder = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);

    const patientId = toIntValue(
        getFirstDefined(body, ['patientid', 'patient_id', 'PATIENT_ID']),
        'patientid'
    );
    const hinaiOrderId = toIntValue(
        getFirstDefined(body, ['hnoid', 'hinaiorderid', 'hinai_order_id', 'order_id']),
        'hnoid'
    );
    const existingPoId = getFirstDefined(body, ['poid', 'po_id']);
    const dietType = toIntValue(
        getFirstDefined(body, ['diettype', 'diet_type']),
        'diettype'
    );

    const dietRemark = toUpperTrimmed(
        getFirstDefined(body, ['dietremark', 'diet_remark'])
    );
    const nursingRemark = toUpperTrimmed(
        getFirstDefined(body, ['nurseremark', 'nursingremark', 'nursing_remark'])
    );
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
                liquid_hours: Number(body.lqhours || body.liquid_hours || 0),
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
                ptm_id: item.ptm_id,
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
        const pageId = getFirstDefined(body, ['page_id', 'pageid']);
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
    const patientId = toIntValue(
        getFirstDefined(body, ['patientid', 'patient_id', 'PATIENT_ID']),
        'patientid'
    );
    const hinaiOrderId = toIntValue(
        getFirstDefined(body, ['hinaiorderid', 'hnoid', 'hinai_order_id', 'order_id']),
        'hinaiorderid'
    );
    const dietType = toIntValue(
        getFirstDefined(body, ['diettype', 'diet_type']),
        'diettype'
    );
    const poId = getFirstDefined(body, ['poid', 'po_id']);

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
        patient: {
            mrno: hinaiOrder.mr_no?.toString() || '',
            patient_id: hinaiOrder.patient_id,
            patient: hinaiOrder.patient_name || '',
            mobileno: hinaiOrder.mobile_no || '',
            email: hinaiOrder.email || '',
            doctor: hinaiOrder.doctor || '',
            agegender: hinaiOrder.age_gender || '',
            bed_no: hinaiOrder.bed_no || '',
            admissionno: hinaiOrder.admission_no || '',
            admissiondate: hinaiOrder.admission_at,
            ward: hinaiOrder.ward || '',
            name: hinaiOrder.menu_detail || '',
            hinaiorderid: hinaiOrder.order_id,
        },
        order: {
            poid: sourcePatientOrder?.id || null,
            diettype: dietType,
            nursingRemark:
                mode === 'edit'
                    ? sourcePatientOrder?.nursing_remark || ''
                    : toUpperTrimmed(prefillNursingRemark),
            dietRemark: sourcePatientOrder?.diet_remark || '',
        },
        menu_items: menuTimes.map((menu) => {
            const detail = detailMap.get(menu.id);

            return {
                mid: menu.id,
                description: menu.description,
                ptmid: detail?.ptm_id || '0',
                checked: Boolean(detail?.ptm_id),
                remarks: detail?.remarks || '',
            };
        }),
    };
};

export const getHinaiOrdersOldAsRawQuery = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id', 'SITEID', 'siteid']);
    const viewdata = getFirstDefined(body, ['viewdata']) || '0';
    const ordertype = getFirstDefined(body, ['ordertype']) || '0';

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

export const checkPageLock = async (body, jwtUser) => {
    const pageId = toIntValue(getFirstDefined(body, ['page_id', 'pageid']), 'page_id');
    const patientId = toStringValue(getFirstDefined(body, ['patient_id', 'patientid', 'poid']), 'patient_id');
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
    const pageId = toIntValue(getFirstDefined(body, ['page_id', 'pageid']), 'page_id');
    const patientId = toStringValue(getFirstDefined(body, ['patient_id', 'patientid', 'poid']), 'patient_id');
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
    const siteIdParam = getFirstDefined(body, ['site_id', 'SITEID', 'siteid']);
    const viewdata = getFirstDefined(body, ['viewdata']) || '0';
    const ordertype = getFirstDefined(body, ['ordertype']) || '0';

    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = body.search || '';

    const mstId = await resolveSiteMapping(siteIdParam, 'mst_id');
    if (!mstId) throw new Error('Invalid site mapping');

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    let where = {
        mst_id: mstId,
        is_discharge: false
    };

    // order type filter
    if (ordertype === 'extra') {
        where.menu = 'EXTRA ORDER';
        where.diet_type = 18894123;
    } else if (ordertype === 'regular') {
        where.menu = { not: 'EXTRA ORDER' };
        where.diet_type = { not: 18894123 };
    }

    // today filter
    if (viewdata === 'today') {
        where.order_date = {
            gte: startOfDay,
            lte: endOfDay
        };
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

    // fetch ordered (IMPORTANT)
    const rows = await prisma.hinaiOrder.findMany({
        where,
        orderBy: [
            { patient_id: 'asc' },
            { order_id: 'desc' } // latest first
        ],
        include: {
            patientOrders: {
                where: { is_active: true },
                orderBy: { created_at: 'desc' },
                take: 1
            }
        }
    });

    // 🔥 DISTINCT ON replacement (latest per patient)
    const map = new Map();

    for (const row of rows) {
        if (!map.has(row.patient_id)) {
            map.set(row.patient_id, row);
        }
    }

    const uniqueRows = Array.from(map.values());

    // pagination AFTER grouping
    const total = uniqueRows.length;
    const paginated = uniqueRows.slice((page - 1) * limit, page * limit);

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: paginated.map(row => {
            const po = row.patientOrders?.[0] || null;

            return {
                patient_id: row.patient_id,
                mrno: row.mr_no ? row.mr_no.toString() : null,
                patient: row.patient_name,
                bed_no: row.bed_no,
                ward: row.ward,
                scname: row.ward,
                doctor: row.doctor,
                menu: row.menu,
                name: row.menu_detail,
                order_date: row.order_date,
                diff: Math.floor((Date.now() - new Date(row.order_date)) / 60000),
                diet_type: row.diet_type,
                hinaiorderid: row.order_id,
                admission_date: row.admission_at,
                nursing_user: row.nursing_user,
                is_diet_change: row.is_diet_change,
                is_transfer: row.is_transfer,
                dietorder: [17129492, 17129493, 17129495].includes(row.diet_type)
                    ? 'liquid'
                    : 'regular',
                approved_date: row.approved_date,
                // Additional fields from PHP implementation
                POID: po?.id || null,
                dispatched: po?.dispatched || false,
                iscancelled: po?.is_cancelled || false,
                lqhours: po?.liquid_hours || 0,
                nursingRemark: po?.nursing_remark || row.nurse_remark || '',
                punchdate: po?.created_at || null,
                agegender: row.age_gender || '',
                admissionno: row.admission_no || '',
                ostatus: row.status,
                email: row.email || '',
                mobileno: row.mobile_no || '',
                DIAGNO: row.diagnosis || ''
            };
        })
    };
};

export const getPatientLiquidOrderFormData = async (body, jwtUser) => {
    const patientId = toIntValue(
        getFirstDefined(body, ['patientid', 'patient_id', 'PATIENT_ID']),
        'patientid'
    );
    const hinaiOrderId = toIntValue(
        getFirstDefined(body, ['hinaiorderid', 'hnoid', 'hinai_order_id', 'order_id']),
        'hinaiorderid'
    );
    const dietType = toIntValue(
        getFirstDefined(body, ['diettype', 'diet_type']),
        'diettype'
    );
    const poId = getFirstDefined(body, ['poid', 'po_id']);

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
        patient: {
            mrno: hinaiOrder.mr_no?.toString() || '',
            patient_id: hinaiOrder.patient_id,
            patient: hinaiOrder.patient_name || '',
            mobileno: hinaiOrder.mobile_no || '',
            email: hinaiOrder.email || '',
            doctor: hinaiOrder.doctor || '',
            agegender: hinaiOrder.age_gender || '',
            bed_no: hinaiOrder.bed_no || '',
            admissionno: hinaiOrder.admission_no || '',
            admissiondate: hinaiOrder.admission_at,
            ward: hinaiOrder.ward || '',
            name: hinaiOrder.menu_detail || '',
            hinaiorderid: hinaiOrder.order_id,
        },
        order: {
            poid: sourcePatientOrder?.id || null,
            diettype: dietType,
            liquid_hours: sourcePatientOrder?.liquid_hours || 0,
            nursingRemark:
                mode === 'edit'
                    ? sourcePatientOrder?.nursing_remark || ''
                    : toUpperTrimmed(prefillNursingRemark),
            dietRemark:
                mode === 'edit'
                    ? sourcePatientOrder?.diet_remark || ''
                    : latestDietRemark,
        },
        timings,
    };
};

export const getPatientLiquidOrderTimings = async (body, jwtUser) => {
    const patientId = toIntValue(
        getFirstDefined(body, ['patientid', 'patient_id', 'PATIENT_ID']),
        'patientid'
    );
    const liquidHours = toIntValue(
        getFirstDefined(body, ['lqhours', 'liqhour', 'liquid_hours']),
        'lqhours'
    );

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
            poid: latestLiquidOrder.id,
            timings: latestLiquidOrder.patientOrderLiquids.map((item) => ({
                liquid_time: item.liquid_time,
                remarks: item.remarks || '',
            })),
        };
    }

    return {
        liquid_hours: liquidHours,
        poid: null,
        timings: buildDefaultLiquidTimings(liquidHours),
    };
};

export const createPatientLiquidOrder = async (body, jwtUser) => {
    const auditUserId = getAuditUserId(jwtUser);
    const patientId = toIntValue(
        getFirstDefined(body, ['patientid', 'patient_id', 'PATIENT_ID']),
        'patientid'
    );
    const hinaiOrderId = toIntValue(
        getFirstDefined(body, ['hnoid', 'hinaiorderid', 'hinai_order_id', 'order_id']),
        'hnoid'
    );
    const dietType = toIntValue(
        getFirstDefined(body, ['diettype', 'diet_type']),
        'diettype'
    );
    const existingPoId = getFirstDefined(body, ['poid', 'po_id']);
    const liquidHours = toIntValue(
        getFirstDefined(body, ['liqhour', 'lqhours', 'liquid_hours']),
        'liqhour'
    );
    const dietRemark = toUpperTrimmed(
        getFirstDefined(body, ['dietremark', 'diet_remark'])
    );
    const nursingRemark = toUpperTrimmed(
        getFirstDefined(body, ['nurseremark', 'nursingremark', 'nursing_remark'])
    );

    const timingValues = parsePipeValueList(
        getFirstDefined(body, ['dtime', 'liquid_times'])
    );
    const timingRemarks = parsePipeValueList(
        getFirstDefined(body, ['dtitm', 'liquid_remarks'])
    );

    const timings = Array.isArray(body.timings) && body.timings.length
        ? body.timings.map((item, index) => ({
              liquid_time: toIntValue(
                  getFirstDefined(item, ['liquid_time', 'liqtime']),
                  `timings[${index}].liquid_time`
              ),
              remarks: toUpperTrimmed(
                  getFirstDefined(item, ['remarks', 'liquid_remark'])
              ),
          }))
        : timingValues.map((time, index) => ({
              liquid_time: toIntValue(time, `dtime[${index}]`),
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
        const pageId = getFirstDefined(body, ['page_id', 'pageid']);
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
           TO_CHAR(dl.approveddate,'yyyy-mm-dd hh24:mi') AS approveddate
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
           TO_CHAR(NVL(dr.approveddatetime, dr.createddatetime),'yyyy-mm-dd hh24:mi') AS approveddate
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
      AND dr.createddatetime >= SYSDATE - INTERVAL '2' HOUR
),
cte1 AS (
    SELECT ROW_NUMBER() OVER (PARTITION BY mrno,diettype ORDER BY cdate DESC) RN,
           ad_siteid, siteid, patient_id, mrno, PATIENT, admissionnumber,
           admdate, bed_id, bed_no, scname, DOCTOR,
           RTRIM(XMLAGG(XMLELEMENT(e, description || ', ')).EXTRACT('//text()'), ', ') AS NAME,
           name AS menu, cdate, diettype, hinaiorderid,
           username, isdietchanged, Diagnosis, agegender,
           mobileno, email, nurseremark, approveddate
    FROM cte
    GROUP BY cdate, ad_siteid, siteid, patient_id, mrno, PATIENT,
             admissionnumber, admdate, bed_id, bed_no,
             scname, DOCTOR, name, diettype, hinaiorderid,
             username, isdietchanged, Diagnosis, agegender,
             mobileno, email, nurseremark, approveddate
)
SELECT *
FROM cte1
WHERE rn = 1
  AND TO_CHAR(cdate,'yyyy-mm-dd') = :ctime
`;

    const result = await connection.execute(
      sql,
      { ctime },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    for (const row of result.rows) {
      const mappedSiteId = await resolveSiteMapping(
        row.SITEID, 'site_id'
      );
    //   console.log("mappedSiteId",mappedSiteId);
      await prisma.hinaiOrder.upsert({
        where: { order_id: Number(row.HINAIORDERID) },
        update: {
          ward: row.SCNAME,
          bed_no: row.BED_NO,
          is_transfer: false,
          is_discharge: false
        },
        create: {
          mst_id: mappedSiteId,
          patient_id: Number(row.PATIENT_ID),
          mr_no: BigInt(row.MRNO),
          patient_name: row.PATIENT,
          admission_no: row.ADMISSIONNUMBER,
          admission_at: new Date(row.ADMDATE),
          bed_no: row.BED_NO,
          ward: row.SCNAME,
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
      left join visit v on v.visitid=pa.visitid
      left join discharge d on d.visit=v.visitid
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
        getFirstDefined(body, ['site_id', 'siteid', 'SITEID']) ||
        jwtUser?.siteID;
    if (!siteIdParam) {
        throw new Error('site id is required');
    }

    const viewdata = body.viewdata || 'today';
    const ordertype = body.ordertype || 'all';

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
    if (ordertype === 'extra') {
        orderTypeCondition = Prisma.sql`
            AND menu = 'EXTRA ORDER'
        `;
    }

    if (ordertype === 'regular') {
        orderTypeCondition = Prisma.sql`
            AND menu != 'EXTRA ORDER'
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
        totals:
            `Total Orders: ${total_orders}` +
            ` | Punched Orders: ${punched_orders}` +
            ` | Pending Order Punch: ${pending_order_punch}` +
            ` | Pending Extra Order Punch: ${pending_extra_order_punch}`
    };
};

export const getMenuDetails = async (body, jwtUser) => {
    try {

        const dietTypeValue = getFirstDefined(body, ['diettype', 'diet_type',]);
        const hinaiOrderIdValue = getFirstDefined(body, ['hinaiorderid', 'hinai_order_id',]);
        const patientIdValue = getFirstDefined(body, ['patientid', 'patient_id',]);

        const dietType = toIntValue(dietTypeValue, 'diettype');
        const hinaiOrderId = toIntValue(hinaiOrderIdValue, 'hinaiorderid');
        const patientId = toIntValue(patientIdValue, 'patientid');

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

            return {
                mid: menu.id,
                description: menu.description,
                ptmid: detail?.ptm_id || null,
                remarks: detail?.remarks || '',
                poid: latestPatientOrder?.id || null,
                diet_remark:
                    latestPatientOrder?.diet_remark || '',
            };
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

        // console.log(orderDetails);
        /*
        ===========================================================
        NO DATA
        ===========================================================
        */
        if (!orderDetails) {
            return {
                res1: 0,
            };
        }

        /*
        ===========================================================
        RESPONSE
        ===========================================================
        */
        return {
                    mrno: orderDetails.mr_no?.toString() || '',
                    patient_id: orderDetails.patient_id,
                    patient: orderDetails.patient_name || '',
                    mobileno: orderDetails.mobile_no || '',
                    email: orderDetails.email || '',
                    doctor: orderDetails.doctor || '',
                    agegender: orderDetails.age_gender || '',
                    bed_no: orderDetails.bed_no || '',
                    admno: orderDetails.admission_no || '',
                    admissiondate: orderDetails.admission_at,
                    scname: orderDetails.ward || '',
                    nurseremark:
                        orderDetails.nurse_remark?.toUpperCase() || '',
                    name: orderDetails.menu_detail || '',
                    admdate: orderDetails.admission_at,
                    createdon: orderDetails.created_at,
                };

    } catch (error) {
        console.error(
            'getHinaiOrderDetails error:',
            error
        );

        throw new Error(error.message);
    }
};

export const getNursingRemarks = async (body, jwtUser) => {
    let connection;

    try {
        const patientId = Number(body.patient_id || body.patientid);
        const hinaiOrderId = Number(body.order_id || body.orderid);

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
            hinaiorder_id: row.HINAIORDERID,
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
