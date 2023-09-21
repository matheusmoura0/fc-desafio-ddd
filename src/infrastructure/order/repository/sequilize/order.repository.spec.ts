import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

    it('should update an existing order', async () => {
      const customerRepository = new CustomerRepository();
      const customer = new Customer("123", "Customer 1");
      const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
      customer.changeAddress(address);
      await customerRepository.create(customer);
  
      const productRepository = new ProductRepository();
      const product = new Product("123", "Product 1", 10);
      await productRepository.create(product);
  
      const orderItem = new OrderItem(
        "1",
        product.name,
        product.price,
        product.id,
        2
      );
  
      const order = new Order("123", "123", [orderItem]);
  
      const orderRepository = new OrderRepository();
      await orderRepository.create(order);
  
      const updatedOrder = new Order('456', '123', [
        new OrderItem('1', 'Product 2', 10, '123', 2),
      ]);
      await orderRepository.update(updatedOrder);
      
  

      const updatedOrderModel = await OrderModel.findOne({
        where: { id: '123' },
        include: ['items'],
      });

      expect(updatedOrderModel.toJSON()).toEqual({
        id: '123',
        customer_id: '123',
        total: updatedOrder.total(),
        items: [
          {
            id: '1',
            name: 'Product 1',
            price: 10,
            product_id: '123',
            order_id: '123',
            quantity: 2,
          },
        ],
      });
    });


    it('should find an existing order', async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);
  
    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);
  
    const orderItem = new OrderItem(
      "1",
        product.name,
      product.price,
      product.id,
      2
    );
  
    const order = new Order("123", "123", [orderItem]);
  
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({ where: { id: '123' } });

    const foundOrder = await orderRepository.find('123');

    expect(orderModel.toJSON()).toStrictEqual(foundOrder);
    })

    it('should find all existing orders', async () => {
      const customerRepository = new CustomerRepository();
      const customer = new Customer("123", "Customer 1");
      const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
      customer.changeAddress(address);
      await customerRepository.create(customer);
    
      const productRepository = new ProductRepository();
      const product = new Product("5555", "Product 321", 10);
      await productRepository.create(product);
    
      const orderItem = new OrderItem(
        "1",
        product.name,
        product.price,
        product.id,
        2
      );
    
      const order = new Order("1", "123", [orderItem]);
    
      const orderRepository = new OrderRepository();
    
      await orderRepository.create(order);
    
      const customerRepository2 = new CustomerRepository();
      const customer2 = new Customer("132", "Customer 2");
      const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
      customer2.changeAddress(address2);
      await customerRepository2.create(customer2);
    
      const productRepository2 = new ProductRepository();
      const product2 = new Product("123", "Product 1", 10);
      await productRepository2.create(product2);
    
      const orderItem2 = new OrderItem( // Create a new order item for order2
        "2",
        product2.name,
        product2.price,
        product2.id,
        2
      );
    
      const order2 = new Order("2", "132", [orderItem2]);
    
      const orderRepository2 = new OrderRepository();
      await orderRepository2.create(order2);
    
      const foundOrders = await orderRepository2.findAll();

      console.log(foundOrders);
    
      const orders = [order, order2];
    
      expect(foundOrders).toHaveLength(orders.length);
    });
}
);
