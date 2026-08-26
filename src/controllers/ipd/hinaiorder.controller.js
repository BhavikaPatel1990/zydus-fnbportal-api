import response from '../../utils/response.js';
import * as hinaiOrderService from '../../services/ipd/hinaiorder.service.js';
import * as pdfGenerator from '../../utils/pdfGenerator.js';

const handleHinaiOrderError = (res, error, fallbackMessage) => {
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


export const createHinaiOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.createHinaiOrder(req.body, req.user);
        const message = data.created
            ? 'HINAI order created successfully'
            : 'HINAI order already exists, insert ignored';

        return response.success(res, message, data);
    } catch (error) {
        console.error('Error creating HINAI order:', error);
        return handleHinaiOrderError(res, error, 'Failed to create HINAI order');
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
        return handleHinaiOrderError(res, error, 'Failed to update transfer status');
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
        return handleHinaiOrderError(res, error, 'Failed to update discharge status');
    }

};

export const getHinaiOrders = async (req, res) => {
    try {
        const data = await hinaiOrderService.getHinaiOrders(req.body, req.user);
        return response.success(res, 'HINAI orders fetched successfully', data);
    } catch (error) {
        console.error('Error fetching HINAI orders:', error);
        return handleHinaiOrderError(res, error, 'Failed to fetch HINAI orders');
    }

};

export const refreshHinaiOrders = async (req, res) => {
    try {
        const data = await hinaiOrderService.refreshHinaiOrders(req.body, req.user);
        return response.success(res, 'HINAI orders refreshed successfully', data);
    } catch (err) {
        console.error('Error refreshing HINAI orders:', err);
        return handleHinaiOrderError(res, err, 'Failed to refresh HINAI orders');
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
        return handleHinaiOrderError(res, error, 'Failed to fetch order summary');
    }

};

export const getMenuDetails = async (req, res) => {
    try {
        const data = await hinaiOrderService.getMenuDetails(req.body, req.user);
        return response.success(res, 'Menu details fetched successfully', data);

    } catch (error) {
        console.error('Menu details error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to fetch menu details');
    }
};

export const getHinaiOrderDetails = async (req, res) => {
    try {

        const data = await hinaiOrderService.getHinaiOrderDetails(req.body, req.user);

        return response.success(res, 'HINAI order details fetched successfully', data);

    } catch (error) {
        console.error('HINAI order details error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to fetch HINAI order details');
    }
};

export const getNursingDeskDietDetails = async (req, res) => {
    try {
        const data = await hinaiOrderService.getNursingDeskDietDetails(req.body, req.user);
        return response.success(res, 'Nursing desk diet details fetched successfully', data);
    } catch (error) {
        console.error('getNursingDeskDietDetails controller error:', error);
        return handleHinaiOrderError(res, error, 'Failed to fetch nursing desk diet details');
    }
};

export const getNursingRemarks = async (req, res) => {
    try {
        const data = await hinaiOrderService.getNursingRemarks(req.body, req.user);

        return response.success(res, 'Nursing remarks fetched successfully', data);
    } catch (error) {
        console.error('getNursingRemarks controller error:', error);
        return handleHinaiOrderError(res, error, 'Failed to fetch nursing remarks');
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
        return handleHinaiOrderError(res, error, 'Failed to save patient order');
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
        return handleHinaiOrderError(res, error, 'Failed to fetch form data');
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
        return handleHinaiOrderError(res, error, 'Failed to fetch patient liquid order form data');
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
        return handleHinaiOrderError(res, error, 'Failed to fetch patient liquid order timings');
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
        return handleHinaiOrderError(res, error, 'Failed to save liquid order');
    }

};

export const checkPageLock = async (req, res) => {
    try {
        const data = await hinaiOrderService.checkPageLock(req.body, req.user);
        return response.success(res, 'Page lock status verified', data);

    } catch (error) {
        console.error('checkPageLock error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to verify page lock status');
    }
};

export const releasePageLock = async (req, res) => {
    try {
        const data = await hinaiOrderService.releasePageLock(req.body, req.user);
        return response.success(res, 'Page lock released successfully', data);


    } catch (error) {
        console.error('releasePageLock error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to release page lock');
    }
};

export const updateDiagnosis = async (req, res) => {
    try {
        const data = await hinaiOrderService.updateDiagnosis(req.body, req.user);
        return response.success(res, 'Diagnosis updated successfully', data);
    } catch (error) {
        console.error('updateDiagnosis error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to update diagnosis');
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
        return handleHinaiOrderError(res, error, 'Failed to dispatch order');
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
        return handleHinaiOrderError(res, error, 'Failed to cancel order');
    }
};

export const outPatientOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.outPatientOrder(req.body, req.user);
        return response.success(res, 'Order marked as OUT', data);

    } catch (error) {
        console.error('outPatientOrder error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to mark order as out');
    }
};

export const clearPatientOrders = async (req, res) => {
    try {
        const data = await hinaiOrderService.clearPatientOrders(req.body, req.user);
        return response.success(res, 'Orders cleared successfully', data);
    } catch (error) {
        console.error('clearPatientOrders error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to clear orders');
    }
};

export const getWards = async (req, res) => {
    try {
        const data = await hinaiOrderService.getWards(req.body);
        return response.success(res, 'Wards fetched successfully', data);
    } catch (error) {
        console.error('Error fetching wards:', error);
        return handleHinaiOrderError(res, error, 'Failed to fetch wards');
    }

};

export const getMenus = async (req, res) => {
    try {
        const data = await hinaiOrderService.getMenus(req.body);
        return response.success(res, 'Menus fetched successfully', data);
    } catch (error) {
        console.error('Error fetching menus:', error);
        return handleHinaiOrderError(res, error, 'Failed to fetch menus');
    }
};

export const getOrderMenuListWithPrintStatus = async (req, res) => {
    try {
        const data = await hinaiOrderService.getOrderMenuListWithPrintStatus(req.body);
        return response.success(res, 'Order menu list fetched successfully', data);
    } catch (error) {
        console.error('Error fetching order menu list:', error);
        return handleHinaiOrderError(res, error, 'Failed to fetch menu list');
    }

};

export const downloadOrdersCsv = async (req, res) => {
    try {
        const csvData = await hinaiOrderService.downloadOrdersCsv(req.body, req.user);
        if (!csvData) {
            return response.normalError(res, 'No records to display...');
        }

        const itemType = req.body.item || 'regular';
        const fileName = `TodayOrders_${new Date().toISOString().slice(0, 10)}_${itemType}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(csvData);
    } catch (error) {
        console.error('downloadOrdersCsv error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to download orders CSV');
    }
};


export const downloadOutAllOrdersCsv = async (req, res) => {
    try {
        const requestData = { ...req.body, ...req.query };
        const csvData = await hinaiOrderService.downloadOutAllOrdersCsv(requestData, req.user);
        if (!csvData) {
            return response.normalError(res, 'No records to display...');
        }

        const fileName = `OutAllOrders_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(csvData);
    } catch (error) {
        console.error('downloadOutAllOrdersCsv error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to download out orders CSV');
    }
};

export const getOutAllList = async (req, res) => {
    try {
        const data = await hinaiOrderService.getOutAllList(req.body, req.user);
        return response.success(res, 'Out all orders list fetched successfully', data);
    } catch (error) {
        console.error('getOutAllList error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to fetch out all orders list');
    }
};

export const getClearanceList = async (req, res) => {
    try {
        const data = await hinaiOrderService.getClearanceList(req.body, req.user);
        return response.success(res, 'Clearance list fetched successfully', data);
    } catch (error) {
        console.error('getClearanceList error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to fetch clearance list');
    }
};

export const downloadClearanceCsv = async (req, res) => {
    try {
        const requestData = { ...req.body, ...req.query };
        const csvData = await hinaiOrderService.downloadClearanceCsv(requestData, req.user);
        if (!csvData) {
            return response.normalError(res, 'No records to display...');
        }

        const fileName = `Clearance_Report_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        return res.send(csvData);
    } catch (error) {
        console.error('downloadClearanceCsv error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to download clearance CSV');
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
        return handleHinaiOrderError(res, error, 'Failed to generate patient sticker');
    }

};

export const printBulkStickers = async (req, res) => {
    try {
        const stickersData = await hinaiOrderService.getBulkStickerData(req.body, req.user);

        if (!stickersData.length) {
            return response.normalError(res, 'No records to display...');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=bulk_stickers.pdf');

        pdfGenerator.generateBulkStickers(stickersData, res);
    } catch (error) {
        console.error('printBulkStickers error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to generate bulk stickers');
    }
};

export const printLiquidStickers = async (req, res) => {
    try {
        const stickersData = await hinaiOrderService.getLiquidStickerData(req.body, req.user);

        if (!stickersData.length) {
            return response.normalError(res, 'No records to display...');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=liquid_stickers.pdf');

        pdfGenerator.generateLiquidStickers(stickersData, res);
    } catch (error) {
        console.error('printLiquidStickers error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to generate liquid stickers');
    }
};

export const printSingleLiquidStickers = async (req, res) => {
    try {
        const stickersData = await hinaiOrderService.getSingleLiquidStickerData(req.body, req.user);

        if (!stickersData.length) {
            return response.normalError(res, 'No records to display...');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=single_liquid_sticker.pdf');

        pdfGenerator.generateSingleLiquidStickers(stickersData, res);
    } catch (error) {
        console.error('printSingleLiquidStickers error:', error.message);
        return handleHinaiOrderError(res, error, 'Failed to generate single liquid sticker');
    }
};


export const hasNewOrder = async (req,res) => {
    try {

        const data = await hinaiOrderService.checkLatestHinaiOrders(req.body, req.user);

        return response.success(res, 'Latest order status fetched successfully', data);

    } catch (error) {

        console.error(
            'has New Order controller error:',
            error
        );

        return handleHinaiOrderError(res, error, 'Failed to fetch order status');
    }
};

export const getLastOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.getLastOrder(req.body, req.user);
        return response.success(res, 'Last HINAI order fetched successfully', data);
    } catch (error) {
        console.error('getLastOrder controller error:', error);
        return handleHinaiOrderError(res, error, 'Failed to fetch last order');
    }
};

export const updateSiteId = async (req, res) => {
    try {
        const data = await hinaiOrderService.updateSiteId(req.body, req.user);
        return response.success(res, 'HINAI order site updated successfully', data);
    } catch (error) {
        console.error('updateSiteId controller error:', error);
        return handleHinaiOrderError(res, error, 'Failed to update HINAI order site');
    }
};

export const getLastPunchOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.getLastPunchOrder(req.body, req.user);
        return response.success(res, 'Last punched order fetched successfully', data);
    } catch (error) {
        console.error('getLastPunchOrder controller error:', error);
        return handleHinaiOrderError(res, error, 'Failed to fetch last punch order');
    }
};

export const updatePOSiteId = async (req, res) => {
    try {
        const data = await hinaiOrderService.updatePOSiteId(req.body, req.user);
        return response.success(res, 'PatientOrder site updated successfully', data);
    } catch (error) {
        console.error('updatePOSiteId controller error:', error);
        return handleHinaiOrderError(res, error, 'Failed to update PatientOrder site');
    }
};
