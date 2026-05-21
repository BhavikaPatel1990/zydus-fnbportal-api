import prisma from '../../config/db.js';
import axios from 'axios';
import { getOracleConnection } from '../../config/oracleDb.js';
import oracledb from 'oracledb';

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

    return siteRecord.id;
};

const resolveHINAISiteMapping = async (siteValue) => {
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

    return siteRecord.site_id;
};

const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);

    const pad = (n) => n.toString().padStart(2, '0');

    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getSiteIdParam = (body) => getFirstDefined(body, ['site_id', 'SITEID', 'siteid']);

const getDateRangeParams = (body) => ({
    from_date: getFirstDefined(body, ['from_date', 'fromdate', 'fromDate', 'sdate']),
    to_date: getFirstDefined(body, ['to_date', 'todate', 'toDate', 'edate']),
});

const buildPaginationResponse = ({ total, page, limit, data }) => ({
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    data,
});

export const getDietOrder = async (body, jwtUser) => {
    const siteIdParam = getSiteIdParam(body);
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
                nbm_total: 0,
                sd_total: 0,
                liquid_total: 0,
                tube_feed_total: 0,
                full_diet_total: 0,
                total_diet_order: 0,
                punched_order_total: 0,
                pending_punch_total: 0,
            });
        }

        const stats = wardMap.get(wardName);
        const dietType = Number(order.diet_type);
        const isPunched = order.status === true;

        const dietTypesTracked = [17154031, 17129481, 17129492, 17129493, 17129494];
        
        if (dietTypesTracked.includes(dietType)) {
            stats.total_diet_order++;
            if (isPunched) stats.punched_order_total++;
            else stats.pending_punch_total++;

            if (dietType === 17154031) stats.nbm_total++;
            else if (dietType === 17129481) stats.sd_total++;
            else if (dietType === 17129492) stats.liquid_total++;
            else if (dietType === 17129493) stats.tube_feed_total++;
            else if (dietType === 17129494) stats.full_diet_total++;
        }
    }

    // 4. Filter by search
    let wardList = Array.from(wardMap.values());
    if (search) {
        wardList = wardList.filter(item => item.ward.toLowerCase().includes(search));
    }

    // 5. Sort by ward name
    wardList.sort((a, b) => a.ward.localeCompare(b.ward));

    // 6. Compute aggregated totals across ALL wards (before pagination)
    const aggregated_totals = wardList.reduce(
        (acc, ward) => {
            acc.nbm_total += ward.nbm_total;
            acc.sd_total += ward.sd_total;
            acc.liquid_total += ward.liquid_total;
            acc.tube_feed_total += ward.tube_feed_total;
            acc.full_diet_total += ward.full_diet_total;
            acc.total_diet_order += ward.total_diet_order;
            acc.punched_order_total += ward.punched_order_total;
            acc.pending_punch_total += ward.pending_punch_total;
            return acc;
        },
        {
            nbm_total: 0,
            sd_total: 0,
            liquid_total: 0,
            tube_feed_total: 0,
            full_diet_total: 0,
            total_diet_order: 0,
            punched_order_total: 0,
            pending_punch_total: 0,
        }
    );

    // 7. Paginate
    const total = wardList.length;
    const paginatedData = wardList.slice((page - 1) * limit, page * limit);

    return {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        aggregated_totals,
        data: paginatedData,
    };
};

export const downloadWardDietOrderCsv = async (body, jwtUser) => {
    const summary = await getDietOrder({ ...body, page: 1, limit: 1000000 }, jwtUser);
    const data = summary.data;
    const totals = summary.aggregated_totals;

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
            row.nbm_total,
            row.sd_total,
            row.liquid_total,
            row.tube_feed_total,
            row.full_diet_total,
            row.total_diet_order,
            row.punched_order_total,
            row.pending_punch_total
        ].map(escapeCsvValue).join(','))
    ];

    // Add Total Aggregated View row at the bottom
    csvRows.push(
        [
            'TOTAL AGGREGATED VIEW',
            totals.nbm_total,
            totals.sd_total,
            totals.liquid_total,
            totals.tube_feed_total,
            totals.full_diet_total,
            totals.total_diet_order,
            totals.punched_order_total,
            totals.pending_punch_total
        ].map(escapeCsvValue).join(',')
    );

    return csvRows.join('\n');
};

export const getDietSheet = async (body, jwtUser) => {
    const siteIdParam = getSiteIdParam(body);
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = (body.search || '').toLowerCase();
    const dietType = body.diet_type ? Number(body.diet_type) : undefined;
    const locationId = body.location_id;

    const mstId = await resolveSiteMapping(siteIdParam);
    if (!mstId) throw new Error('Invalid site mapping');

    let locationName = undefined;
    if (locationId && locationId !== 'all' && locationId !== '') {
        try {
            const loc = await prisma.location.findUnique({ where: { id: locationId } });
            locationName = loc?.name;
        } catch (error) {
            console.error('location_id lookup error:', error.message);
        }
    }


    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    // 1️⃣ Get latest patient orders
    const patientOrders = await prisma.patientOrder.findMany({
        where: {
            mst_id: mstId,
            is_active: true,
            diet_type: dietType ? { equals: dietType, not: 18894123 } : { not: 18894123 },
            created_at: { gte: start, lte: end }
        },
        orderBy: { id: 'desc' }
    });

    // latest per patient
    const latestMap = new Map();
    for (const po of patientOrders) {
        if (!latestMap.has(po.patient_id)) {
            latestMap.set(po.patient_id, po);
        }
    }

    const latestOrders = Array.from(latestMap.values());

    const hinaiIds = latestOrders.map(o => o.hinai_order_id);

    // 2️⃣ Fetch Hinai orders
    const hinaiOrders = await prisma.hinaiOrder.findMany({
        where: {
            order_id: { in: hinaiIds },
            mst_id: mstId,
            is_discharge: false,
            diet_type: { notIn: [17129492, 17129493, 17129495] },
            ward: locationName
        }
    });

    const hinaiMap = new Map(hinaiOrders.map(h => [h.order_id, h]));

    // 3️⃣ Fetch diet types
    const dietTypes = await prisma.dietType.findMany();
    const dietMap = new Map(dietTypes.map(d => [d.diet_type_id, d.diet_name]));

    // 4️⃣ Fetch order details (remarks)
    const poIds = latestOrders.map(o => o.id);

    const details = await prisma.patientOrderDetail.findMany({
        where: { po_id: { in: poIds } }
    });

    // group by po_id + ptm_id
    const detailMap = {};
    for (const d of details) {
        if (!detailMap[d.po_id]) detailMap[d.po_id] = {};
        detailMap[d.po_id][d.ptm_id] = d.remarks;
    }

    // 5️⃣ Build response
    let result = latestOrders
        .filter(po => hinaiMap.has(po.hinai_order_id))
        .map(po => {
            const ho = hinaiMap.get(po.hinai_order_id);
        const remarks = detailMap[po.id] || {};

        return {
            mr_no: ho.mr_no?.toString(),
            patient_name: ho.patient_name,
            bed_no: ho.bed_no,
            ward: ho.ward,
            diet_name: dietMap.get(po.diet_type) || '',
            nursing_remark: po.nursing_remark,
            diet_remark: po.diet_remark,

            em: remarks[1] || '',
            breakfast: remarks[2] || '',
            mid_morning: remarks[3] || '',
            lunch: remarks[4] || '',
            two_pm: remarks[5] || '',
            evening_tea: remarks[6] || '',
            six_pm: remarks[7] || '',
            dinner: remarks[8] || '',
            bed_time: remarks[9] || ''
        };
    });

    // 6️⃣ Search
    if (search) {
        result = result.filter(r =>
            r.patient_name?.toLowerCase().includes(search) ||
            r.ward?.toLowerCase().includes(search) ||
            r.bed_no?.toLowerCase().includes(search)
        );
    }

    // 7️⃣ Sort
    result.sort((a, b) => {
        if (a.ward === b.ward) return a.bed_no.localeCompare(b.bed_no);
        return a.ward.localeCompare(b.ward);
    });

    // 8️⃣ Pagination
    const total = result.length;
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        data: paginated
    };
};

export const downloadDietSheetCsv = async (body, jwtUser) => {
    const res = await getDietSheet({ ...body, page: 1, limit: 1000000 }, jwtUser);

    const data = res.data;

    const headers = [
        'MRNO', 'Patient Name', 'Ward', 'Bed No', 'Diet',
        'Nursing Remark', 'Diet Remark',
        'EM', 'BF', 'MM', 'Lunch', '2PM', 'ET', '6PM', 'Dinner', 'BT'
    ];

    const escape = (v) => {
        if (!v) return '';
        const s = String(v);
        return s.includes(',') ? `"${s}"` : s;
    };

    const rows = [
        headers.join(','),
        ...data.map(r => [
            r.mr_no,
            r.patient_name,
            r.ward,
            r.bed_no,
            r.diet_name,
            r.nursing_remark,
            r.diet_remark,
            r.em,
            r.breakfast,
            r.mid_morning,
            r.lunch,
            r.two_pm,
            r.evening_tea,
            r.six_pm,
            r.dinner,
            r.bed_time
        ].map(escape).join(','))
    ];

    return rows.join('\n');
};

export const getDietSheetLiquids = async (body, jwtUser) => {
    const siteIdParam = getSiteIdParam(body);
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = (body.search || '').toLowerCase();
    const dietType = body.diet_type ? Number(body.diet_type) : undefined;
    const locationId = body.location_id;

    const mstId = await resolveSiteMapping(siteIdParam);
    if (!mstId) throw new Error('Invalid site mapping');

    let locationName = undefined;
    if (locationId && locationId !== 'all' && locationId !== '') {
        try {
            const loc = await prisma.location.findUnique({ where: { id: locationId } });
            locationName = loc?.name;
        } catch (error) {
            console.error('location_id lookup error:', error.message);
        }
    }


    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));


    // 1️⃣ Latest patient orders (same logic)
    const patientOrders = await prisma.patientOrder.findMany({
        where: {
            mst_id: mstId,
            is_active: true,
            diet_type: dietType ? { equals: dietType, not: 18894123 } : { not: 18894123 },
            created_at: { gte: start, lte: end }
        },
        orderBy: { id: 'desc' }
    });

    const latestMap = new Map();
    for (const po of patientOrders) {
        if (!latestMap.has(po.patient_id)) {
            latestMap.set(po.patient_id, po);
        }
    }

    const latestOrders = Array.from(latestMap.values());

    const hinaiIds = latestOrders.map(o => o.hinai_order_id);

    // 2️⃣ Fetch Hinai Orders with LIQUID FILTER
    const hinaiOrders = await prisma.hinaiOrder.findMany({
        where: {
            order_id: { in: hinaiIds },
            mst_id: mstId,
            is_discharge: false,
            diet_type: { in: [17129492, 17129493, 17129495] },
            ward: locationName
        }
    });

    const hinaiMap = new Map(hinaiOrders.map(h => [h.order_id, h]));

    // 3️⃣ Diet types
    const dietTypes = await prisma.dietType.findMany();
    const dietMap = new Map(dietTypes.map(d => [d.diet_type_id, d.diet_name]));

    // 4️⃣ Build result
    let result = latestOrders
        .filter(po => hinaiMap.has(po.hinai_order_id)) // only liquids
        .map(po => {
            const ho = hinaiMap.get(po.hinai_order_id);

            return {
                mr_no: ho?.mr_no?.toString(),
                patient_name: ho?.patient_name,
                bed_no: ho?.bed_no,
                ward: ho?.ward,
                diet_name: dietMap.get(po.diet_type) || '',
                nursing_remark: po.nursing_remark,
                diet_remark: po.diet_remark
            };
        });

    // 5️⃣ Search
    if (search) {
        result = result.filter(r =>
            r.patient_name?.toLowerCase().includes(search) ||
            r.ward?.toLowerCase().includes(search) ||
            r.bed_no?.toLowerCase().includes(search)
        );
    }

    // 6️⃣ Sort
    result.sort((a, b) => {
        if (a.ward === b.ward) return a.bed_no.localeCompare(b.bed_no);
        return a.ward.localeCompare(b.ward);
    });

    // 7️⃣ Pagination
    const total = result.length;
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
        data: paginated
    };
};

export const downloadDietSheetLiquidsCsv = async (body, jwtUser) => {
    const res = await getDietSheetLiquids({ ...body, page: 1, limit: 1000000 }, jwtUser);

    const data = res.data;

    const headers = [
        'MRNO', 'Patient Name', 'Ward', 'Bed No',
        'Diet', 'Nursing Remark', 'Diet Remark'
    ];

    const escape = (v) => {
        if (!v) return '';
        const s = String(v);
        return s.includes(',') ? `"${s}"` : s;
    };

    const rows = [
        headers.join(','),
        ...data.map(r => [
            r.mr_no,
            r.patient_name,
            r.ward,
            r.bed_no,
            r.diet_name,
            r.nursing_remark,
            r.diet_remark
        ].map(escape).join(','))
    ];

    return rows.join('\n');
};

export const getPendingDietOrders = async (body, jwtUser) => {
    const siteIdParam = getSiteIdParam(body);
    const search = (body.search || '').toLowerCase();

    // ✅ KEEP mapping (used in your system elsewhere)
    const mstId = await resolveHINAISiteMapping(siteIdParam);
    if (!mstId) throw new Error('Invalid site mapping');

    let connection;

    try {
        connection = await getOracleConnection();

        const sql = ` 
        /* 🔴 QUERY SAME AS PROVIDED - NO CHANGE */
        WITH cte AS (
            select p.patient_id,p.mrno,pm2.prefix||' '||p.patientname as PATIENT,ip.admissionnumber,
            to_char(ip.admissiondate,'yyyy-mm-dd') adate,ip.admissiondate admdate,b.bed_id,
            b.bed_no,sc.service_center_name,sc.service_center_name scname,
            pm.prefix||' '||e.employee_name as DOCTOR,dl.createddatetime cdate,
            dc.name,di.description,dl.diettiming as diettype,dlr.id hinaiorderid,
            h.username,dl.docno as DOC
            from inpatients ip 
            left join visit v on v.visitid=ip.visitid
            left join patient p on p.patient_id=ip.patient
            left join bed b on b.bed_id=ip.bed
            left join employee e on e.employee_id=ip.consultant
            left join prefix_master pm on pm.id=e.emp_prefix
            left join prefix_master pm2 on pm2.id=p.patprefix
            left join servicecenter sc on sc.service_center_id=b.servicecenter
            left join discharge d on d.visit=v.visitid 
            left join dietlaterequest dl on dl.patient=p.patient_id 
                and to_char(dl.createddatetime,'yyyy-mm-dd')=to_char(sysdate,'yyyy-mm-dd')
            left join dietconfiguration dc on dc.id = dl.dietprescription 
            left join DIET_LATE_REQUESTDETAILITEM dlr on dlr.dietlaterequest_detailid =dl.id
            left join DIETITEM di on di.id = dlr.dietitemid
            left join hisuser h on h.id=dl.createdby
            where ip.ADMITTED_SITE=:siteId 
                and d.dateofdischarge is null 
                and ip.visit_patientstatus<>1122

            union 

            select p.patient_id,p.mrno,pm2.prefix||' '||p.patientname as PATIENT,
            ip.admissionnumber,to_char(ip.admissiondate,'yyyy-mm-dd') adate,
            ip.admissiondate admdate,b.bed_id,b.bed_no,
            sc.service_center_name scname,sc.service_center_name,
            pm.prefix||' '||e.employee_name as DOCTOR,dr.createddatetime cdate,
            dc.name,di.description,dr.diettiming as diettype,
            drd.id hinaiorderid,h.username,dr.docno as DOC
            from inpatients ip  
            left join visit v on v.visitid=ip.visitid
            left join patient p on p.patient_id=ip.patient
            left join bed b on b.bed_id=ip.bed
            left join employee e on e.employee_id=ip.consultant
            left join prefix_master pm on pm.id=e.emp_prefix
            left join prefix_master pm2 on pm2.id=p.patprefix
            left join servicecenter sc on sc.service_center_id=b.servicecenter
            left join discharge d on d.visit=v.visitid               
            left join DIETREQUESTDETAIL dq on dq.patient = p.patient_id 
                and dq.request_cancel_status<>2
            inner join dietrequest dr on dr.id=dq.drid 
                and to_char(dr.createddatetime,'yyyy-mm-dd')=to_char(sysdate,'yyyy-mm-dd')
            left join dietconfiguration dc on dc.id = dq.dietclassification 
            left join DIETREQUESTDETAILITEM drd on dq.id = drd.dietrequest_detailid 
            left join DIETITEM di on di.id = drd.dietitemid
            left join hisuser h on h.id=dr.requestedby
            where ip.ADMITTED_SITE=:siteId 
                and d.dateofdischarge is null 
                and ip.visit_patientstatus<>1122
                and drd.id IS NOT NULL
        ),
        cte1 as (
            select row_number() over (partition by mrno order by bed_no desc)as RN,
            patient_id,mrno,PATIENT,admissionnumber,adate,admdate,bed_id,bed_no,
            scname,DOCTOR,
            (
                RTRIM(SYS_XMLAGG(
                    SYS_XMLGEN(description||' ,')
                ).EXTRACT('/ROWSET/ROW/text()').getStringVal(), ', ')
            ) AS NAME,
            name as menu,cdate,diettype,hinaiorderid,username,DOC
            from cte 
            group by cdate,patient_id,mrno,PATIENT,admissionnumber,adate,admdate,
            bed_id,bed_no,scname,DOCTOR,name,diettype,hinaiorderid,username,DOC
        )
        select scname as WARD,bed_no as BED,mrno as MRN,PATIENT,adate,
        to_char(admdate,'YYYY-MM-DD hh24:mi') admdate,DOCTOR, patient_id 
        from cte1 
        where rn=1 
        AND patient_id != 1157622 
        and doc is null
        order by 1,5 desc
        `;

        const result = await connection.execute(
            sql,
            {
                siteId: mstId
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        let rows = result.rows || [];

        if (search) {
            rows = rows.filter(r =>
                r.PATIENT?.toLowerCase().includes(search) ||
                r.WARD?.toLowerCase().includes(search) ||
                r.BED?.toLowerCase().includes(search) ||
                r.MRN?.toString().toLowerCase().includes(search)
            );
        }

        const data = rows.map((row) => ({
            ward: row.WARD || '',
            bed_no: row.BED || '',
            mr_no: row.MRN ? String(row.MRN) : '',
            patient_name: row.PATIENT || '',
            admission_date_only: row.ADATE || '',
            admission_date: row.ADMDATE || '',
            doctor: row.DOCTOR || '',
            patient_id: row.PATIENT_ID || null,
        }));

        return {
            total: data.length,
            data
        };

    } catch (err) {
        console.error('Error in getPendingDietOrders:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing Oracle connection:', err);
            }
        }
    }
};

export const getExtraOrders = async (body, jwtUser) => {
    try {
        const siteIdParam = getSiteIdParam(body);
        const { from_date: sdateRaw, to_date: edateRaw } = getDateRangeParams(body);
        const search = (body.search || '').trim();

        const page = parseInt(body.page) || 1;
        const limit = parseInt(body.limit) || 10;
        const skip = (page - 1) * limit;

        // ✅ Site mapping
        const mstId = await resolveSiteMapping(siteIdParam);
        if (!mstId) throw new Error('invalid site mapping');

        // ✅ Date validation
        if (!sdateRaw || !edateRaw) {
            throw new Error('from_date and to_date are required');
        }

        const sdate = new Date(sdateRaw);
        const edate = new Date(edateRaw);

        if (isNaN(sdate.getTime()) || isNaN(edate.getTime())) {
            throw new Error('invalid date format, use yyyy-mm-dd');
        }

        sdate.setHours(0, 0, 0, 0);
        edate.setHours(23, 59, 59, 999);

        // ✅ Search filter
        const searchFilter = search
            ? {
                  OR: [
                      { nursing_remark: { contains: search, mode: 'insensitive' } },
                      { diet_remark: { contains: search, mode: 'insensitive' } },
                      {
                          hinaiOrder: {
                              OR: [
                                  { patient_name: { contains: search, mode: 'insensitive' } },
                                  { doctor: { contains: search, mode: 'insensitive' } },
                                  { ward: { contains: search, mode: 'insensitive' } },
                                  { bed_no: { contains: search, mode: 'insensitive' } },
                                  { admission_no: { contains: search, mode: 'insensitive' } }
                              ]
                          }
                      }
                  ]
              }
            : {};

        // ✅ Count
        const total = await prisma.patientOrder.count({
            where: {
                mst_id: mstId,
                diet_type: 18894123,
                created_at: { gte: sdate, lte: edate },
                is_active: true,
                ...searchFilter
            }
        });

        // ✅ Data fetch
        const orders = await prisma.patientOrder.findMany({
            where: {
                mst_id: mstId,
                diet_type: 18894123,
                created_at: { gte: sdate, lte: edate },
                is_active: true,
                ...searchFilter
            },
            include: {
                hinaiOrder: true
            },
            orderBy: [
                { created_at: 'desc' },
                { hinaiOrder: { ward: 'asc' } },
                { hinaiOrder: { order_date: 'asc' } }
            ],
            skip,
            take: limit
        });

        // ✅ Diet map
        const dietTypes = await prisma.dietType.findMany({
            where: { diet_type_id: 18894123 }
        });

        const dietMap = new Map(
            dietTypes.map(d => [d.diet_type_id, d.diet_name])
        );

        // ✅ Date formatter
        const formatDate = (date) => {
            if (!date) return '';
            const d = new Date(date);
            const pad = (n) => n.toString().padStart(2, '0');
            return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        // ✅ Final response (snake_case)
        const data = orders.map(po => {
            const ho = po.hinaiOrder;

            return {
                mr_no: ho?.mr_no?.toString() || '',
                patient_name: ho?.patient_name || '',
                age_gender: ho?.age_gender || '',
                admission_no: ho?.admission_no || '',
                ho_date: formatDate(ho?.order_date),
                menu_detail: ho?.menu_detail || '',
                admission_date: formatDate(ho?.admission_at),
                bed_no: ho?.bed_no || '',
                ward: ho?.ward || '',
                doctor: ho?.doctor || '',
                mobile_no: ho?.mobile_no || '',
                username: po?.created_by || '',
                diet_name: dietMap.get(po.diet_type) || '',
                nursing_remark: po.nursing_remark || '',
                diet_remark: po.diet_remark || '',
                punch_date: formatDate(po.created_at),
                nursing_user: ho?.nursing_user || ''
            };
        });

        return {
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
            data
        };

    } catch (error) {
        console.error('getExtraOrders service error:', error);
        throw error;
    }
};

export const downloadExtraOrdersCsv = async (body, jwtUser) => {
    try {
        // ✅ reuse existing logic (fetch ALL data)
        const result = await getExtraOrders(
            { ...body, page: 1, limit: 1000000 },
            jwtUser
        );

        const data = result.data;

        // ✅ CSV headers (snake_case)
        const headers = [
            'mr_no',
            'patient_name',
            'age_gender',
            'admission_no',
            'ho_date',
            'menu_detail',
            'admission_date',
            'bed_no',
            'ward',
            'doctor',
            'mobile_no',
            'username',
            'diet_name',
            'nursing_remark',
            'diet_remark',
            'punch_date',
            'nursing_user'
        ];

        // ✅ Escape CSV values
        const escapeCsvValue = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // ✅ Build CSV rows
        const csvRows = [
            headers.join(','),
            ...data.map(row =>
                headers.map(field => escapeCsvValue(row[field])).join(',')
            )
        ];

        return csvRows.join('\n');

    } catch (error) {
        console.error('downloadExtraOrdersCsv service error:', error);
        throw error;
    }
};

export const getLiquidData = async (body, jwtUser) => {
    try {
        const siteIdParam = getSiteIdParam(body);
        const { from_date: fromRaw, to_date: toRaw } = getDateRangeParams(body);
        const search = (body.search || '').trim();

        const page = parseInt(body.page) || 1;
        let limit = parseInt(body.limit);

        if (!limit) limit = 10;

        // ✅ special case: fetch all
        const isAll = limit === -1;
        const skip = (page - 1) * limit;

        // ✅ site mapping
        const mstId = await resolveSiteMapping(siteIdParam);
        if (!mstId) throw new Error('invalid site mapping');

        // ✅ date validation (dd-mm-yyyy input)
        if (!fromRaw || !toRaw) throw new Error('from_date and to_date are required');

        const parseDMY = (d) => {
            const [day, month, year] = d.split('-');
            return new Date(`${year}-${month}-${day}`);
        };

        const from = parseDMY(fromRaw);
        const to = parseDMY(toRaw);

        if (isNaN(from) || isNaN(to)) throw new Error('invalid date format (use dd-mm-yyyy)');

        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        // ✅ latest patient orders (PHP max(id))
        const latestOrders = await prisma.patientOrder.findMany({
            where: {
                mst_id: mstId,
                diet_type: { not: 18894123 }
            },
            orderBy: { id: 'desc' }
        });

        const latestMap = new Map();
        for (const po of latestOrders) {
            if (!latestMap.has(po.patient_id)) {
                latestMap.set(po.patient_id, po.id);
            }
        }

        const latestIds = Array.from(latestMap.values());

        if (!latestIds.length) {
            return {
                total: 0,
                page,
                limit,
                total_pages: 0,
                data: []
            };
        }

        // ✅ main query
        const records = await prisma.patientOrder.findMany({
            where: {
                id: { in: latestIds },
                mst_id: mstId,
                is_active: true,
                hinaiOrder: {
                    is_discharge: false,
                    order_date: { gte: from, lte: to }
                }
            },
            include: {
                hinaiOrder: true,
                patientOrderLiquids: true
            },
            orderBy: [
                { hinaiOrder: { ward: 'asc' } },
                { hinaiOrder: { bed_no: 'asc' } }
            ]
        });

        // ✅ flatten + filter search
        let data = [];

        for (const po of records) {
            const ho = po.hinaiOrder;

            for (const liq of po.patientOrderLiquids) {
                const row = {
                    ho_date: formatDateTime(ho?.order_date),
                    po_id: po.id,
                    diet_remark: po.diet_remark,
                    nursing_remark: po.nursing_remark,
                    mr_no: ho?.mr_no?.toString(),
                    patient_name: ho?.patient_name,
                    bed_no: ho?.bed_no,
                    ward: ho?.ward,
                    liquid_time: liq?.liquid_time,
                    doctor: ho?.doctor,
                    admission_date: formatDateTime(ho?.admission_at),
                    remarks: liq?.remarks || '-',
                    liquid_detail_id: liq?.id,
                    username: po?.created_by,
                    admission_no: ho?.admission_no,
                    menu: ho?.menu,
                    menu_detail: ho?.menu_detail,
                    punch_date: formatDateTime(po.created_at)
                };

                data.push(row);
            }
        }

        // ✅ search (multi-field)
        if (search) {
            const s = search.toLowerCase();
            data = data.filter(r =>
                Object.values(r).some(v =>
                    String(v || '').toLowerCase().includes(s)
                )
            );
        }

        // ✅ pagination
        const total = data.length;
        const paginated = isAll ? data : data.slice(skip, skip + limit);

        return {
            total,
            page,
            limit,
            total_pages: isAll ? 1 : Math.ceil(total / limit),
            data: paginated
        };

    } catch (error) {
        console.error('getLiquidData error:', error);
        throw error;
    }
};

export const downloadLiquidDataCsv = async (body, jwtUser) => {
    const result = await getLiquidData(
        { ...body, page: 1, limit: -1 },
        jwtUser
    );

    const data = result.data;

    const headers = [
        'ho_date','po_id','diet_remark','nursing_remark','mr_no','patient_name',
        'bed_no','ward','liquid_time','doctor','admission_date','remarks',
        'liquid_detail_id','username','admission_no','menu','menu_detail','punch_date'
    ];

    const escape = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const rows = [
        headers.join(','),
        ...data.map(r => headers.map(h => escape(r[h])).join(','))
    ];

    return rows.join('\n');
};

export const searchPatient = async (body) => {
    try {

        /*
        ===========================================================
        REQUEST VALUES
        ===========================================================
        */

        let searchTerm = body.search || body.query || "";

        /*
        ===========================================================
        VALIDATION
        ===========================================================
        */

        searchTerm = searchTerm.trim();

        if (!searchTerm) {
        return [];
        }

        /*
        ===========================================================
        SEARCH QUERY
        ===========================================================
        */

        const patients = await prisma.$queryRaw`
        SELECT DISTINCT ON (mr_no, patient_name)
            mr_no,
            UPPER(patient_name) AS patient_name,
            patient_id,
            order_date
        FROM "HinaiOrder"
        WHERE
            is_active = true
            AND (
            CAST(mr_no AS TEXT) ILIKE ${searchTerm + "%"}
            OR UPPER(patient_name) ILIKE UPPER(${"%" + searchTerm + "%"})
            OR (
                CAST(mr_no AS TEXT) || ' ' || UPPER(patient_name)
            ) ILIKE UPPER(${searchTerm + "%"})
            )
        ORDER BY
            mr_no,
            patient_name,
            order_date DESC
        LIMIT 20
        `;

        /*
        ===========================================================
        RESPONSE FORMAT
        ===========================================================
        */

        if (!patients.length) {
        return [];
        }

        return patients.map((item) => ({
        label: `${item.mr_no} | ${item.patient_name}`,
        mr_no: item.mr_no.toString(),
        patient_id: item.patient_id,
        patient_name: item.patient_name
        }));

    } catch (error) {
        console.error("searchPatient Service Error:", error);
        throw error;
    }
};

export const getPatientOrderLedger = async (body, jwtUser) => {
  try {

    /*
    ===========================================================
    REQUEST VALUES
    ===========================================================
    */

    const mrn = (body.mr_no || body.mrn || '').trim();

    if (!mrn) {
      throw new Error("mr_no is required");
    }

    /*
    ===========================================================
    JWT VALUES
    ===========================================================
    */

    const siteId = jwtUser.siteID;

    const loginUsername = jwtUser.username;

    /*
    ===========================================================
    GET ORDER DATA
    ===========================================================
    */

    const orders = await prisma.hinaiOrder.findMany({

      where: {
        mst_id: BigInt(siteId),
        mr_no: BigInt(mrn),
        is_active: true
      },

      select: {

        mst_id: true,

        mr_no: true,

        patient_id: true,

        patient_name: true,

        age_gender: true,

        menu_detail: true,

        admission_at: true,

        bed_no: true,

        ward: true,

        doctor: true,

        order_date: true,

        is_diet_change: true,

        is_transfer: true,

        status: true,

        patientOrders: {

          where: {
            is_active: true
          },

          select: {

            id: true,

            nursing_remark: true,

            diet_remark: true,

            created_at: true,

            created_by: true,

            diet_type: true,

            dispatched: true,

            is_cancelled: true,

            liquid_hours: true
          },

          orderBy: [
            {
              is_cancelled: "asc"
            },
            {
              dispatched: "asc"
            },
            {
              created_at: "desc"
            }
          ]
        }
      },

      orderBy: {
        order_date: "desc"
      }
    });

    /*
    ===========================================================
    NO DATA
    ===========================================================
    */

    if (!orders.length) {
      return [];
    }

    /*
    ===========================================================
    GET DIET TYPES
    ===========================================================
    */

    const dietTypeIds = [];

    orders.forEach((order) => {

      order.patientOrders.forEach((po) => {

        if (po.diet_type !== null) {
          dietTypeIds.push(po.diet_type);
        }
      });
    });

    /*
    ===========================================================
    FETCH DIET TYPES
    ===========================================================
    */

    const dietTypes = await prisma.dietType.findMany({

      where: {
        diet_type_id: {
          in: [...new Set(dietTypeIds)]
        }
      },

      select: {
        diet_type_id: true,
        diet_name: true
      }
    });

    /*
    ===========================================================
    CREATE DIET MAP
    ===========================================================
    */

    const dietMap = {};

    dietTypes.forEach((diet) => {

      dietMap[diet.diet_type_id] =
        diet.diet_name;
    });

    /*
    ===========================================================
    FINAL RESPONSE
    ===========================================================
    */

    const response = [];

    for (const ho of orders) {

      /*
      =======================================================
      NO PATIENT ORDER
      =======================================================
      */

      if (!ho.patientOrders.length) {

        response.push({

          site_id:
            ho.mst_id?.toString(),

          mr_no:
            ho.mr_no?.toString(),

          patient_id:
            ho.patient_id,

          patient_name:
            ho.patient_name,

          age_gender:
            ho.age_gender,

          menu_detail:
            ho.menu_detail,

          admission_date:
            ho.admission_at,

          bed_no:
            ho.bed_no,

          ward:
            ho.ward,

          doctor:
            ho.doctor,

          username:
            loginUsername,

          diet_name:
            null,

          nursing_remark:
            null,

          diet_remark:
            null,

          ho_date:
            ho.order_date,

          punch_date:
            null,

          diff:
            null,

          diet_type:
            null,

          dispatched:
            null,

          is_cancelled:
            null,

          is_diet_change:
            ho.is_diet_change,

          is_transfer:
            ho.is_transfer,

          order_status:
            ho.status,

          liquid_hours:
            null
        });

      } else {

        /*
        =======================================================
        PATIENT ORDER LOOP
        =======================================================
        */

        for (const po of ho.patientOrders) {

          /*
          ===================================================
          TIME DIFFERENCE
          ===================================================
          */

          let diffMinutes = null;

          if (
            po.created_at &&
            ho.order_date
          ) {

            diffMinutes = Math.floor(
              (
                new Date(po.created_at) -
                new Date(ho.order_date)
              ) / (1000 * 60)
            );
          }

          response.push({

            site_id:
              ho.mst_id?.toString(),

            mr_no:
              ho.mr_no?.toString(),

            patient_id:
              ho.patient_id,

            patient_name:
              ho.patient_name,

            age_gender:
              ho.age_gender,

            menu_detail:
              ho.menu_detail,

            admission_date:
              ho.admission_at,

            bed_no:
              ho.bed_no,

            ward:
              ho.ward,

            doctor:
              ho.doctor,

            username:
              po.created_by ||
              loginUsername,

            diet_name:
              dietMap[po.diet_type] || null,

            nursing_remark:
              po.nursing_remark,

            diet_remark:
              po.diet_remark,

            ho_date:
              ho.order_date,

            punch_date:
              po.created_at,

            diff:
              diffMinutes,

            diet_type:
              po.diet_type,

            dispatched:
              po.dispatched,

            is_cancelled:
              po.is_cancelled,

            is_diet_change:
              ho.is_diet_change,

            is_transfer:
              ho.is_transfer,

            order_status:
              ho.status,

            liquid_hours:
              po.liquid_hours
          });
        }
      }
    }

    /*
    ===========================================================
    RETURN RESPONSE
    ===========================================================
    */

    return response;
  } catch (error) {
    console.error(
      "getOrderLedger Service Error:",
      error
    );

    throw error;
  }
};

export const getDietTypes = async () => {
    try {
        const dietTypes = await prisma.dietType.findMany({
            where: {
                is_active: true,
                deleted_at: null
            },
            select: {
                diet_type_id: true,
                diet_name: true
            },
            orderBy: {
                diet_name: 'asc'
            }
        });

        return dietTypes.map(d => ({
            value: d.diet_type_id,
            label: d.diet_name
        }));
    } catch (error) {
        console.error('getDietTypes service error:', error);
        throw error;
    }
};
