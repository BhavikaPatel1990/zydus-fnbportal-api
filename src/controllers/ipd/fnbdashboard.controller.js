import response from '../../utils/response.js';
import * as fnbDashboardService from '../../services/ipd/fnbdashboard.service.js';

const handleDashboardError = (res, error, fallbackMessage) => {
    const message = error?.message || fallbackMessage;

    if (error?.statusCode === 401) {
        return response.authError(res, message);
    }

    if (error?.statusCode === 403) {
        return response.error(res, message);
    }

    if (error?.statusCode === 400) {
        return response.serverError(res, message);
    }

    return response.normalError(res, message);
};

export const getDietOrder = async (req, res) => {
    try {
        const data = await fnbDashboardService.getDietOrder(req.body, req.user);
        return response.success(res, 'Diet order fetched successfully', data);
    } catch (error) {
        console.error('getDietOrder error:', error.message);
        return handleDashboardError(res, error, 'Failed to fetch diet order');
    }
};

export const downloadWardDietOrderCsv = async (req, res) => {
    try {
        const csvContent = await fnbDashboardService.downloadWardDietOrderCsv(req.body, req.user);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=ward_diet_order.csv');
        return res.status(200).send(csvContent);
    } catch (error) {
        console.error('downloadWardDietOrderCsv error:', error.message);
        return handleDashboardError(res, error, 'Failed to download ward diet order CSV');
    }
};

export const getDietSheet = async (req, res) => {
    try {
        const data = await fnbDashboardService.getDietSheet(req.body, req.user);
        return response.success(res, 'Diet sheet fetched successfully', data);
    } catch (error) {
        console.error('getDietSheet error:', error.message);
        return handleDashboardError(res, error, 'Failed to fetch diet sheet');
    }
};

export const downloadDietSheetCsv = async (req, res) => {
    try {
        const csv = await fnbDashboardService.downloadDietSheetCsv(req.body, req.user);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=diet_sheet.csv');

        return res.status(200).send(csv);
    } catch (error) {
        console.error('downloadDietSheetCsv error:', error.message);
        return handleDashboardError(res, error, 'Failed to download diet sheet CSV');
    }
};

export const getDietSheetLiquids = async (req, res) => {
    try {
        const data = await fnbDashboardService.getDietSheetLiquids(req.body, req.user);
        return response.success(res, 'Diet sheet liquids fetched successfully', data);
    } catch (error) {
        console.error('getDietSheetLiquids error:', error.message);
        return handleDashboardError(res, error, 'Failed to fetch diet sheet liquids');
    }
};

export const downloadDietSheetLiquidsCsv = async (req, res) => {
    try {
        const csv = await fnbDashboardService.downloadDietSheetLiquidsCsv(req.body, req.user);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=diet_sheet_liquids.csv');

        return res.status(200).send(csv);
    } catch (error) {
        console.error('downloadDietSheetLiquidsCsv error:', error.message);
        return handleDashboardError(res, error, 'Failed to download diet sheet liquids CSV');
    }
};

export const getPendingDietOrders = async (req, res) => {
    try {
        const data = await fnbDashboardService.getPendingDietOrders(req.body, req.user);
        return response.success(res, 'Pending diet orders fetched successfully', data);
    } catch (error) {
        console.error('getPendingDietOrders error:', error.message);
        return handleDashboardError(res, error, 'Failed to fetch pending diet orders');
    }
};

export const getExtraOrders = async (req, res) => {
    try {
        const data = await fnbDashboardService.getExtraOrders(req.body, req.user);
        return response.success(res, 'Extra orders fetched successfully', data);
    } catch (error) {
        console.error('getExtraOrders error:', error.message);
        return handleDashboardError(res, error, 'Failed to fetch extra orders');
    }
};

export const downloadExtraOrdersCsv = async (req, res) => {
    try {
        const csvContent = await fnbDashboardService.downloadExtraOrdersCsv(
            req.body,
            req.user
        );

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=extra_orders.csv'
        );

        return res.status(200).send(csvContent);
    } catch (error) {
        console.error('downloadExtraOrdersCsv error:', error.message);
        return handleDashboardError(res, error, 'Failed to download extra orders CSV');
    }
};

export const getLiquidData = async (req, res) => {
    try {
        const data = await fnbDashboardService.getLiquidData(req.body, req.user);
        return response.success(res, 'Liquid data fetched successfully', data);

    } catch (error) {
        console.error('getLiquidData error:', error.message);
        return handleDashboardError(res, error, 'Failed to fetch liquid data');
    }
};

export const downloadLiquidDataCsv = async (req, res) => {
    try {
        const csv = await fnbDashboardService.downloadLiquidDataCsv(req.body, req.user);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=liquid_data.csv');

        return res.send(csv);
    } catch (error) {
        console.error('downloadLiquidDataCsv error:', error.message);
        return handleDashboardError(res, error, 'Failed to download liquid data CSV');
    }
};

export const searchPatient = async (req, res) => {
  try {
    const data = await fnbDashboardService.searchPatient(req.body);

    return response.success(res, 'Patient search completed successfully', data);


  } catch (error) {
    console.error("searchPatient Controller Error:", error);
    return handleDashboardError(res, error, 'Failed to search patient');
  }
};

export const getPatientOrderLedger = async (req, res) => {
  try {

    const patientOrderLedgerData = await fnbDashboardService.getPatientOrderLedger(req.body, req.user);

    return response.success(res, 'Patient order ledger fetched successfully', patientOrderLedgerData);

  } catch (error) {

    console.error(
      "Patient order ledger  Error:",
      error
    );

    return handleDashboardError(res, error, 'Failed to fetch patient order ledger');
  }
};

export const getDietTypes = async (req, res) => {
    try {
        const data = await fnbDashboardService.getDietTypes();
        return response.success(res, 'Diet types fetched successfully', data);
    } catch (error) {
        console.error('getDietTypes error:', error.message);
        return handleDashboardError(res, error, 'Failed to fetch diet types');
    }
};

