import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository {
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
    await OrderModel.update(
      {
        customer_id: entity.customerId,
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        where: { id: entity.id },
      }
    );
  }

  async find(orderId: string): Promise<Order | null> {
    const order = await OrderModel.findByPk(orderId);
    return order?.toJSON() as Order;
  }

  async findAll(): Promise<Order[]> {
    const orders = await OrderModel.findAll({
      include: [{ model: OrderItemModel }],
    });
    return orders.map((order) => order.toJSON() as Order);
  }
}
