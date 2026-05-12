import response from '../../utils/response.js';
import * as hinaiOrderService from '../../services/ipd/hinaiorder.service.js';

export const createHinaiOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.createHinaiOrder(req.body, req.user);
        const message = data.created
            ? 'Hinai order created successfully'
            : 'Hinai order already exists, insert ignored';

        return response.success(res, message, data);
    } catch (error) {
        console.error('createHinaiOrder error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const updateHinaiOrderTransfer = async (req, res) => {
    try {
        const data = await hinaiOrderService.markHinaiOrderTransfer(req.body, req.user);
        const message = data.updated
            ? 'Hinai order transfer updated successfully'
            : 'No hinai order found for transfer update';

        return response.success(res, message, data);
    } catch (error) {
        console.error('updateHinaiOrderTransfer error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const updateHinaiOrderDischarge = async (req, res) => {
    try {
        const data = await hinaiOrderService.markHinaiOrderDischarge(req.body, req.user);
        const message = data.updated
            ? 'Hinai order discharge updated successfully'
            : 'No hinai order found for discharge update';

        return response.success(res, message, data);
    } catch (error) {
        console.error('updateHinaiOrderDischarge error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const getHinaiOrders = async (req, res) => {
    try {
        const data = await hinaiOrderService.getHinaiOrders(req.body, req.user);
        return response.success(res, 'Hinai orders fetched successfully', data);
    } catch (error) {
        console.error('getHinaiOrders error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const refreshHinaiOrders = async (req, res) => {
  try {
    const result = await hinaiOrderService.refreshHinaiOrders(req.body, req.user);

    return res.json(result);

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message
    });
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
        console.error('HINAI order summary error:', error);

        return response.serverError(
            res,
            error.message || 'Internal Server Error'
        );
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
            'Patient order created successfully',
            data
        );
    } catch (error) {
        console.error('createPatientOrder error:', error.message);
        return response.serverError(res, error.message);
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
        console.error('getPatientOrderFormData error:', error.message);
        return response.serverError(res, error.message);
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
            'Patient liquid order created successfully',
            data
        );
    } catch (error) {
        console.error('createPatientLiquidOrder error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const checkPageLock = async (req, res) => {
    try {
        const data = await hinaiOrderService.checkPageLock(req.body, req.user);
        return response.success(res, 'Page lock status checked', data);
    } catch (error) {
        console.error('checkPageLock error:', error.message);
        return response.serverError(res, error.message);
    }
};

export const releasePageLock = async (req, res) => {
    try {
        const data = await hinaiOrderService.releasePageLock(req.body, req.user);
        return response.success(res, 'Page lock released', data);
    } catch (error) {
        console.error('releasePageLock error:', error.message);
        return response.serverError(res, error.message);
    }
};
