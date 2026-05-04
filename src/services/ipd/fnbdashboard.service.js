import prisma from '../../config/db.js';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL?.replace(/\/$/, '');

const getFirstDefined = (payload, keys) => {
    for (const key of keys) {
        if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
            return payload[key];
        }
    }
    return undefined;
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

export const getDietOrder = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id', 'SITEID', 'siteid']);
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = (body.search || '').toLowerCase();

    const mstId = await resolveSiteMapping(siteIdParam);
    if (!mstId) {
        throw new Error('Invalid site mapping');
    }

    const ctime = new Date();
    const startOfDay = new Date(ctime.setHours(0, 0, 0, 0));
    const endOfDay = new Date(ctime.setHours(23, 59, 59, 999));

    // 1. Fetch all matching orders for the site and date
    // Ordered by order_id DESC to get the latest order first for each patient
    const orders = await prisma.hinaiOrder.findMany({
        where: {
            mst_id: mstId,
            is_discharge: false,
            order_date: {
                gte: startOfDay,
                lte: endOfDay,
            },
            diet_type: {
                not: 18894123,
            },
        },
        orderBy: {
            order_id: 'desc',
        },
    });

    // 2. Filter for unique latest order per patient
    const latestPatientOrders = [];
    const seenPatients = new Set();
    for (const order of orders) {
        if (!seenPatients.has(order.patient_id)) {
            latestPatientOrders.push(order);
            seenPatients.add(order.patient_id);
        }
    }

    // 3. Aggregate by ward
    const wardMap = new Map();
    for (const order of latestPatientOrders) {
        const wardName = order.ward || 'Unknown';
        if (!wardMap.has(wardName)) {
            wardMap.set(wardName, {
                ward: wardName,
                NBM_Total: 0,
                SD_Total: 0,
                LIQD_Total: 0,
                TUBEFEED_Total: 0,
                FD_Total: 0,
                TotalDietOrder: 0,
                PunchOrdTotal: 0,
                PendingPunchTotal: 0,
            });
        }

        const stats = wardMap.get(wardName);
        const dietType = Number(order.diet_type);
        const isPunched = order.status === true;

        const dietTypesTracked = [17154031, 17129481, 17129492, 17129493, 17129494];
        
        if (dietTypesTracked.includes(dietType)) {
            stats.TotalDietOrder++;
            if (isPunched) stats.PunchOrdTotal++;
            else stats.PendingPunchTotal++;

            if (dietType === 17154031) stats.NBM_Total++;
            else if (dietType === 17129481) stats.SD_Total++;
            else if (dietType === 17129492) stats.LIQD_Total++;
            else if (dietType === 17129493) stats.TUBEFEED_Total++;
            else if (dietType === 17129494) stats.FD_Total++;
        }
    }

    // 4. Filter by search
    let wardList = Array.from(wardMap.values());
    if (search) {
        wardList = wardList.filter(item => item.ward.toLowerCase().includes(search));
    }

    // 5. Sort by ward name
    wardList.sort((a, b) => a.ward.localeCompare(b.ward));

    // 6. Paginate
    const total = wardList.length;
    const paginatedData = wardList.slice((page - 1) * limit, page * limit);

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: paginatedData,
    };
};

export const downloadWardDietOrderCsv = async (body, jwtUser) => {
    const summary = await getDietOrder({ ...body, page: 1, limit: 1000000 }, jwtUser);
    const data = summary.data;

    // Generate CSV content
    const headers = ['Ward', 'NBM Total', 'SD Total', 'LIQD Total', 'TUBEFEED Total', 'FD Total', 'Total Diet Order', 'Punch Ord Total', 'Pending Punch Total'];
    
    const escapeCsvValue = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = [
        headers.join(','),
        ...data.map(row => [
            row.ward,
            row.NBM_Total,
            row.SD_Total,
            row.LIQD_Total,
            row.TUBEFEED_Total,
            row.FD_Total,
            row.TotalDietOrder,
            row.PunchOrdTotal,
            row.PendingPunchTotal
        ].map(escapeCsvValue).join(','))
    ];

    return csvRows.join('\n');
};
