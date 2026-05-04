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

    return siteRecord.site_id;
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

export const getDietSheet = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id', 'SITEID', 'siteid']);
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = (body.search || '').toLowerCase();

    const mstId = await resolveSiteMapping(siteIdParam);
    if (!mstId) throw new Error('Invalid site mapping');

    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    // 1️⃣ Get latest patient orders
    const patientOrders = await prisma.patientOrder.findMany({
        where: {
            mst_id: mstId,
            is_active: true,
            diet_type: { not: 18894123 },
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
            diet_type: { notIn: [17129492, 17129493, 17129495] }
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
    let result = latestOrders.map(po => {
        const ho = hinaiMap.get(po.hinai_order_id) || {};
        const remarks = detailMap[po.id] || {};

        return {
            mrno: ho.mr_no,
            patientname: ho.patient_name,
            bedno: ho.bed_no,
            ward: ho.ward,
            dietname: dietMap.get(po.diet_type) || '',
            nursingremark: po.nursing_remark,
            dietRemark: po.diet_remark,

            EM: remarks[1] || '',
            BF: remarks[2] || '',
            MM: remarks[3] || '',
            Lunch: remarks[4] || '',
            PM2: remarks[5] || '',
            ET: remarks[6] || '',
            PM6: remarks[7] || '',
            Dinner: remarks[8] || '',
            BT: remarks[9] || ''
        };
    });

    // 6️⃣ Search
    if (search) {
        result = result.filter(r =>
            r.patientname?.toLowerCase().includes(search) ||
            r.ward?.toLowerCase().includes(search) ||
            r.bedno?.toLowerCase().includes(search)
        );
    }

    // 7️⃣ Sort
    result.sort((a, b) => {
        if (a.ward === b.ward) return a.bedno.localeCompare(b.bedno);
        return a.ward.localeCompare(b.ward);
    });

    // 8️⃣ Pagination
    const total = result.length;
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
            r.mrno,
            r.patientname,
            r.ward,
            r.bedno,
            r.dietname,
            r.nursingremark,
            r.dietRemark,
            r.EM,
            r.BF,
            r.MM,
            r.Lunch,
            r.PM2,
            r.ET,
            r.PM6,
            r.Dinner,
            r.BT
        ].map(escape).join(','))
    ];

    return rows.join('\n');
};

export const getDietSheetLiquids = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id', 'SITEID', 'siteid']);
    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const search = (body.search || '').toLowerCase();

    const mstId = await resolveSiteMapping(siteIdParam);
    if (!mstId) throw new Error('Invalid site mapping');

    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    // 1️⃣ Latest patient orders (same logic)
    const patientOrders = await prisma.patientOrder.findMany({
        where: {
            mst_id: mstId,
            is_active: true,
            diet_type: { not: 18894123 },
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
            diet_type: { in: [17129492, 17129493, 17129495] }
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
                mrno: ho?.mr_no,
                patientname: ho?.patient_name,
                bedno: ho?.bed_no,
                ward: ho?.ward,
                dietname: dietMap.get(po.diet_type) || '',
                nursingremark: po.nursing_remark,
                dietRemark: po.diet_remark
            };
        });

    // 5️⃣ Search
    if (search) {
        result = result.filter(r =>
            r.patientname?.toLowerCase().includes(search) ||
            r.ward?.toLowerCase().includes(search) ||
            r.bedno?.toLowerCase().includes(search)
        );
    }

    // 6️⃣ Sort
    result.sort((a, b) => {
        if (a.ward === b.ward) return a.bedno.localeCompare(b.bedno);
        return a.ward.localeCompare(b.ward);
    });

    // 7️⃣ Pagination
    const total = result.length;
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
            r.mrno,
            r.patientname,
            r.ward,
            r.bedno,
            r.dietname,
            r.nursingremark,
            r.dietRemark
        ].map(escape).join(','))
    ];

    return rows.join('\n');
};

export const getPendingDietOrders = async (body, jwtUser) => {
    const siteIdParam = getFirstDefined(body, ['site_id', 'SITEID', 'siteid']);
    const search = (body.search || '').toLowerCase();

    // ✅ KEEP mapping (used in your system elsewhere)
    const mstId = await resolveSiteMapping(siteIdParam);
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

        return {
            total: rows.length,
            data: rows
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