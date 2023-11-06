import { Sequelize } from 'sequelize';
import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository {
    private sequelize: Sequelize;
    
    constructor(sequelize: Sequelize) {
        this.sequelize = sequelize;
    }

    async create(entity: Order): Promise<void> {
        await OrderModel.create(
            {
                id: entity.id,
                customer_id: entity.customerId,
                total: entity.total(),
                items: entity.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
            },
            {
                include: [{ model: OrderItemModel }],
            }
        );
    }

    async update(entity: Order): Promise<void> {
        const transaction = await this.sequelize.transaction();
      
        try {
          await OrderModel.update(
            {
              customer_id: entity.customerId,
              total: entity.total(),
            },
            {
              where: { id: entity.id },
              transaction
            }
          );
          const existingItems = await OrderItemModel.findAll({
            where: { order_id: entity.id },
            transaction
          });
      
          for (const item of entity.items) {
            const existingItem = existingItems.find((ei) => ei.id === item.id);
      
            if (existingItem) {
              await OrderItemModel.update({
                name: item.name,
                price: item.price,
                product_id: item.productId,
                quantity: item.quantity,
              }, {
                where: { id: item.id },
                transaction
              });
            } else {
              await OrderItemModel.create({
                id: item.id,
                name: item.name,
                price: item.price,
                product_id: item.productId,
                quantity: item.quantity,
                orderId: entity.id,
              }, {
                transaction
              });
            }
          }
      
          for (const existingItem of existingItems) {
            if (!entity.items.some((item) => item.id === existingItem.id)) {
              await existingItem.destroy({ transaction });
            }
          }
          await transaction.commit();
        } catch (error) {
          await transaction.rollback();
          console.error('Error during order update:', error);
          throw error;
        }
      }
      

    async find(orderId: string): Promise<Order | null> {
        const order = await OrderModel.findByPk(orderId);
        if (!order) return null;
        return order.toJSON() as Order;
    }

    async findAll(): Promise<Order[]> {
        const orders = await OrderModel.findAll({
            include: [{ model: OrderItemModel }],
        });
        
        return orders.map((order) => order.toJSON() as Order);
    }
}
