import response from '../../utils/response.js';
import * as orderService from '../../services/canteen/order.service.js';

const handleOrderError = (res, error, fallbackMessage) => {
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

export const getAllOrders = async (req, res) => {
    try {
        const data = await orderService.getAllOrders(req);
        return response.success(res, "Orders fetched successfully", data);
    } catch (error) {
        console.error("getAllOrders error:", error.message);
        return handleOrderError(res, error, 'Failed to fetch orders');
    }
};

export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await orderService.getOrderById(id);

        if (!data) {
            return response.error(res, "Order not found");
        }

        return response.success(res, "Order fetched successfully", data);
    } catch (error) {
        console.error("getOrderById error:", error.message);
        return handleOrderError(res, error, 'Failed to fetch order');
    }
};

export const createOrder = async (req, res) => {
    try {
        const data = await orderService.createOrder(req.body, req.user);
        return response.success(res, "Order created successfully", data);
    } catch (error) {
        console.error("createOrder error:", error.message);
        return handleOrderError(res, error, 'Failed to create order');
    }
};

export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await orderService.updateOrder(id, req.body, req.user);
        return response.success(res, "Order updated successfully", data);
    } catch (error) {
        console.error("updateOrder error:", error.message);
        return handleOrderError(res, error, 'Failed to update order');
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await orderService.deleteOrder(id, req.user);
        return response.success(res, "Order deleted successfully", data);
    } catch (error) {
        console.error("deleteOrder error:", error.message);
        return handleOrderError(res, error, 'Failed to delete order');
    }
};
