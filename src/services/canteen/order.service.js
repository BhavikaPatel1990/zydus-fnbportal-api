import prisma from '../../config/db.js';

const createHttpError = (message, statusCode = 200) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const createNormalError = (message) => createHttpError(message, 200);

/**
 * Get all orders
 */
export const getAllOrders = async (req) => {
    const orders = await prisma.fnbOrder.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' }
    });
    return orders;
};

/**
 * Get order by ID
 */
export const getOrderById = async (id) => {
    if (!id) {
        throw createNormalError('Order id is required');
    }

    const order = await prisma.fnbOrder.findFirst({
        where: {
            id: id,
            deleted_at: null
        }
    });
    return order;
};

/**
 * Create a new order
 */
export const createOrder = async (body, user) => {
    if (!body?.order_no) {
        throw createNormalError('order_no is required');
    }

    const order = await prisma.fnbOrder.create({
        data: {
            order_no: body.order_no,
            status: body.status || 'PENDING',
            remarks: body.remarks,
            created_by: user.id,
        }
    });
    return order;
};

/**
 * Update an order
 */
export const updateOrder = async (id, body, user) => {
    if (!id) {
        throw createNormalError('Order id is required');
    }

    if (!body?.order_no) {
        throw createNormalError('order_no is required');
    }

    const order = await prisma.fnbOrder.update({
        where: { id: id },
        data: {
            order_no: body.order_no,
            status: body.status,
            remarks: body.remarks,
            updated_by: user.id,
        }
    });
    return order;
};

/**
 * Soft delete an order
 */
export const deleteOrder = async (id, user) => {
    if (!id) {
        throw createNormalError('Order id is required');
    }

    const order = await prisma.fnbOrder.update({
        where: { id: id },
        data: {
            deleted_at: new Date(),
            deleted_by: user.id,
        }
    });
    return order;
};
