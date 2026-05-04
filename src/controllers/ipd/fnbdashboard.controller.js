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
