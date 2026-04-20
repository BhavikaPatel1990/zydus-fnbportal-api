import response from '../../utils/response.js';
import * as hinaiOrderService from '../../services/ipd/hinaiorder.service.js';

export const createHinaiOrder = async (req, res) => {
    try {
        const data = await hinaiOrderService.createHinaiOrder(req.body);
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
        const data = await hinaiOrderService.markHinaiOrderTransfer(req.body);
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
        const data = await hinaiOrderService.markHinaiOrderDischarge(req.body);
        const message = data.updated
            ? 'Hinai order discharge updated successfully'
            : 'No hinai order found for discharge update';

        return response.success(res, message, data);
    } catch (error) {
        console.error('updateHinaiOrderDischarge error:', error.message);
        return response.serverError(res, error.message);
    }
};
