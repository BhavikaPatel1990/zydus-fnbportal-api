import response from '../../utils/response.js';
import * as fnbDashboardService from '../../services/ipd/fnbdashboard.service.js';

export const getDietOrder = async (req, res) => {
    try {
        const data = await fnbDashboardService.getDietOrder(req.body, req.user);
        return response.success(res, 'Diet order fetched successfully', data);
    } catch (error) {
        console.error('getDietOrder error:', error.message);
        return response.serverError(res, error.message);
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
        return response.serverError(res, error.message);
    }
};

export const getDietSheet = async (req, res) => {
    try {
        const data = await fnbDashboardService.getDietSheet(req.body, req.user);
        return response.success(res, 'Diet sheet fetched successfully', data);
    } catch (error) {
        console.error('getDietSheet error:', error.message);
        return response.serverError(res, error.message);
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
        return response.serverError(res, error.message);
    }
};

export const getDietSheetLiquids = async (req, res) => {
    try {
        const data = await fnbDashboardService.getDietSheetLiquids(req.body, req.user);
        return response.success(res, 'Diet sheet liquids fetched successfully', data);
    } catch (error) {
        console.error('getDietSheetLiquids error:', error.message);
        return response.serverError(res, error.message);
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
        return response.serverError(res, error.message);
    }
};

export const getPendingDietOrders = async (req, res) => {
    try {
        const data = await fnbDashboardService.getPendingDietOrders(req.body, req.user);
        return response.success(res, 'Pending diet orders fetched successfully', data);
    } catch (error) {
        console.error('getPendingDietOrders error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const getExtraOrders = async (req, res) => {
    try {
        const data = await fnbDashboardService.getExtraOrders(req.body, req.user);
        return response.success(res, 'Extra orders fetched successfully', data);
    } catch (error) {
        console.error('getExtraOrders error:', error.message);
        return response.serverError(res, error.message);
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
        return response.serverError(res, error.message);
    }
};

export const getLiquidData = async (req, res) => {
    try {
        const data = await fnbDashboardService.getLiquidData(req.body, req.user);
        return response.success(res, 'Liquid data fetched successfully', data);

    } catch (error) {
        console.error('getLiquidData error:', error.message);
        return response.serverError(res, error.message);
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
        return response.serverError(res, error.message);
    }
};

export const searchPatient = async (req, res) => {
  try {
    const data = await fnbDashboardService.searchPatient(req.body);

    return response.success(res, 'Patient search completed successfully', data);


  } catch (error) {
    console.error("searchPatient Controller Error:", error);
    return response.serverError(res, error.message);
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

    return response.serverError(res, error.message);
  }
};

export const getDietTypes = async (req, res) => {
    try {
        const data = await fnbDashboardService.getDietTypes();
        return response.success(res, 'Diet types fetched successfully', data);
    } catch (error) {
        console.error('getDietTypes error:', error.message);
        return response.serverError(res, error.message);
    }
};

