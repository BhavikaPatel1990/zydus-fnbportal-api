import response from '../../utils/response.js';
import * as hinaiOrderService from '../../services/ipd/hinaiorder.service.js';
import * as pdfGenerator from '../../utils/pdfGenerator.js';


export const createHinaiOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.createHinaiOrder(req.body, req.user);
        const message = data.created
            ? 'HINAI order created successfully'
            : 'HINAI order already exists, insert ignored';

        return response.success(res, message, data);
    } catch (error) {
        console.error('Error creating HINAI order:', error);
        return response.serverError(res, error.message || 'Failed to create HINAI order');
    }

};

export const updateHinaiOrderTransfer = async (req, res) => {
    try {
        const data = await hinaiOrderService.markHinaiOrderTransfer(req.body, req.user);
        const message = data.updated
            ? 'HINAI order transfer updated successfully'
            : 'No HINAI order found for transfer update';

        return response.success(res, message, data);
    } catch (error) {
        console.error('Error updating HINAI order transfer:', error);
        return response.serverError(res, error.message || 'Failed to update transfer status');
    }

};

export const updateHinaiOrderDischarge = async (req, res) => {
    try {
        const data = await hinaiOrderService.markHinaiOrderDischarge(req.body, req.user);
        const message = data.updated
            ? 'HINAI order discharge updated successfully'
            : 'No HINAI order found for discharge update';

        return response.success(res, message, data);
    } catch (error) {
        console.error('Error updating HINAI order discharge:', error);
        return response.serverError(res, error.message || 'Failed to update discharge status');
    }

};

export const getHinaiOrders = async (req, res) => {
    try {
        const data = await hinaiOrderService.getHinaiOrders(req.body, req.user);
        return response.success(res, 'HINAI orders fetched successfully', data);
    } catch (error) {
        console.error('Error fetching HINAI orders:', error);
        return response.serverError(res, error.message || 'Failed to fetch HINAI orders');
    }

};

export const refreshHinaiOrders = async (req, res) => {
    try {
        const data = await hinaiOrderService.refreshHinaiOrders(req.body, req.user);
        return response.success(res, 'HINAI orders refreshed successfully', data);
    } catch (err) {
        console.error('Error refreshing HINAI orders:', err);
        return response.serverError(res, err.message || 'Failed to refresh HINAI orders');
    }

};


export const getHinaiOrderSummary = async (req, res) => {
    try {
        const data = await hinaiOrderService.getHinaiOrderSummary(
            req.body,
            req.user
        );

        return response.success(
            res,
            'HINAI order summary fetched successfully',
            data
        );
    } catch (error) {
        console.error('Error fetching HINAI order summary:', error);
        return response.serverError(res, error.message || 'Failed to fetch order summary');
    }

};

export const getMenuDetails = async (req, res) => {
    try {
        const data = await hinaiOrderService.getMenuDetails(req.body, req.user);
        return response.success(res, 'Menu details fetched successfully', data);

    } catch (error) {
        console.error('Menu details error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const getHinaiOrderDetails = async (req, res) => {
    try {

        const data = await hinaiOrderService.getHinaiOrderDetails(req.body, req.user);

        return response.success(res, 'HINAI order details fetched successfully', data);

    } catch (error) {
        console.error('HINAI order details error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const getNursingRemarks = async (req, res) => {
    try {
        const data = await hinaiOrderService.getNursingRemarks(req.body, req.user);

        return response.success(res, 'Nursing remarks fetched successfully', data);
    } catch (error) {
        console.error('getNursingRemarks controller error:', error);

        return response.serverError(res, error.message);
    }
};

export const createPatientOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.createPatientOrder(
            req.body,
            req.user
        );

        return response.success(
            res,
            'Patient order saved successfully',
            data
        );
    } catch (error) {
        console.error('Error saving patient order:', error);
        return response.serverError(res, error.message || 'Failed to save patient order');
    }

};

export const getPatientOrderFormData = async (req, res) => {
    try {
        const data = await hinaiOrderService.getPatientOrderFormData(
            req.body,
            req.user
        );

        return response.success(
            res,
            'Patient order form data fetched successfully',
            data
        );
    } catch (error) {
        console.error('Error fetching patient order form data:', error);
        return response.serverError(res, error.message || 'Failed to fetch form data');
    }

};

export const getPatientLiquidOrderFormData = async (req, res) => {
    try {
        const data = await hinaiOrderService.getPatientLiquidOrderFormData(
            req.body,
            req.user
        );

        return response.success(
            res,
            'Patient liquid order form data fetched successfully',
            data
        );
    } catch (error) {
        console.error('getPatientLiquidOrderFormData error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const getPatientLiquidOrderTimings = async (req, res) => {
    try {
        const data = await hinaiOrderService.getPatientLiquidOrderTimings(
            req.body,
            req.user
        );

        return response.success(
            res,
            'Patient liquid order timings fetched successfully',
            data
        );
    } catch (error) {
        console.error('getPatientLiquidOrderTimings error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const createPatientLiquidOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.createPatientLiquidOrder(
            req.body,
            req.user
        );

        return response.success(
            res,
            'Patient liquid order saved successfully',
            data
        );

    } catch (error) {
        console.error('Error saving patient liquid order:', error);
        return response.serverError(res, error.message || 'Failed to save liquid order');
    }

};

export const checkPageLock = async (req, res) => {
    try {
        const data = await hinaiOrderService.checkPageLock(req.body, req.user);
        return response.success(res, 'Page lock status verified', data);

    } catch (error) {
        console.error('checkPageLock error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const releasePageLock = async (req, res) => {
    try {
        const data = await hinaiOrderService.releasePageLock(req.body, req.user);
        return response.success(res, 'Page lock released successfully', data);


    } catch (error) {
        console.error('releasePageLock error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const updateDiagnosis = async (req, res) => {
    try {
        const data = await hinaiOrderService.updateDiagnosis(req.body, req.user);
        return response.success(res, 'Diagnosis updated successfully', data);
    } catch (error) {
        console.error('updateDiagnosis error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const dispatchPatientOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.dispatchPatientOrder(
            req.body,
            req.user
        );
        return response.success(res, 'Order dispatched successfully', data);
    } catch (error) {
        console.error('Error dispatching patient order:', error);
        return response.serverError(res, error.message || 'Failed to dispatch order');
    }

};

export const cancelPatientOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.cancelPatientOrder(
            req.body,
            req.user
        );
        return response.success(res, 'Order cancelled successfully', data);
    } catch (error) {
        console.error('cancelPatientOrder error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const outPatientOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.outPatientOrder(req.body, req.user);
        return response.success(res, 'Order marked as OUT', data);

    } catch (error) {
        console.error('outPatientOrder error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const clearPatientOrders = async (req, res) => {
    try {
        const data = await hinaiOrderService.clearPatientOrders(req.body, req.user);
        return response.success(res, 'Orders cleared successfully', data);
    } catch (error) {
        console.error('clearPatientOrders error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const getWards = async (req, res) => {
    try {
        const data = await hinaiOrderService.getWards(req.body);
        return response.success(res, 'Wards fetched successfully', data);
    } catch (error) {
        console.error('Error fetching wards:', error);
        return response.serverError(res, error.message || 'Failed to fetch wards');
    }

};

export const getOrderMenuListWithPrintStatus = async (req, res) => {
    try {
        const data = await hinaiOrderService.getOrderMenuListWithPrintStatus(req.body);
        return response.success(res, 'Order menu list fetched successfully', data);
    } catch (error) {
        console.error('Error fetching order menu list:', error);
        return response.serverError(res, error.message || 'Failed to fetch menu list');
    }

};

export const downloadOrdersCsv = async (req, res) => {
    try {
        const csvData = await hinaiOrderService.downloadOrdersCsv(req.body, req.user);
        if (!csvData) {
            return response.serverError(res, 'No records to display...');
        }

        const itemType = req.body.item || 'regular';
        const fileName = `TodayOrders_${new Date().toISOString().slice(0, 10)}_${itemType}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(csvData);
    } catch (error) {
        console.error('downloadOrdersCsv error:', error.message);
        return response.serverError(res, error.message);
    }
};


export const downloadOutAllOrdersCsv = async (req, res) => {
    try {
        const csvData = await hinaiOrderService.downloadOutAllOrdersCsv(req.body, req.user);
        if (!csvData) {
            return response.serverError(res, 'No records to display...');
        }

        const fileName = `OutAllOrders_${new Date().toISOString().slice(0, 10)}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(csvData);
    } catch (error) {
        console.error('downloadOutAllOrdersCsv error:', error.message);
        return response.serverError(res, error.message);
    }
};


export const printPatientSticker = async (req, res) => {
    try {
        const data = await hinaiOrderService.getPatientStickerData(req.body, req.user);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=sticker.pdf');
        
        pdfGenerator.generatePatientSticker(data, res);
    } catch (error) {
        console.error('Error printing patient sticker:', error);
        return response.serverError(res, error.message || 'Failed to generate patient sticker');
    }

};

export const printBulkStickers = async (req, res) => {
    try {
        const stickersData = await hinaiOrderService.getBulkStickerData(req.body, req.user);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=bulk_stickers.pdf');
        
        pdfGenerator.generateBulkStickers(stickersData, res);
    } catch (error) {
        console.error('printBulkStickers error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const printLiquidStickers = async (req, res) => {
    try {
        const stickersData = await hinaiOrderService.getLiquidStickerData(req.body, req.user);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=liquid_stickers.pdf');
        
        pdfGenerator.generateLiquidStickers(stickersData, res);
    } catch (error) {
        console.error('printLiquidStickers error:', error.message);
        return response.serverError(res, error.message);
    }
};


