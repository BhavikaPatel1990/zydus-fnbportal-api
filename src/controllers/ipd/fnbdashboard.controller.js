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