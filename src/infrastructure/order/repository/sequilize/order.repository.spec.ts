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
  let customerRepository: CustomerRepository;
  let productRepository: ProductRepository;
  let orderRepository: OrderRepository;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: console.log,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();

    customerRepository = new CustomerRepository();
    productRepository = new ProductRepository();
    orderRepository = new OrderRepository(sequelize);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

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
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel?.toJSON()).toStrictEqual({
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

  it("should update a second existing order", async () => {
    const customerA = new Customer("789", "Customer A");
    const addressA = new Address("Street A", 10, "Zipcode A", "City A");
    customerA.changeAddress(addressA);
    await customerRepository.create(customerA);
  
    const productA = new Product("789", "Product A", 15);
    await productRepository.create(productA);
  
    const orderItemA = new OrderItem(
      "3",
      productA.name,
      productA.price,
      productA.id,
      3
    );
  
    const orderA = new Order("789", customerA.id, [orderItemA]);
    await orderRepository.create(orderA);
  
    const customerB = new Customer("101112", "Customer B");
    const addressB = new Address("Street B", 20, "Zipcode B", "City B");
    customerB.changeAddress(addressB);
    await customerRepository.create(customerB);
  
    const updatedOrderA = new Order(orderA.id, customerB.id, [
      new OrderItem(orderItemA.id, 'Product B', 15, productA.id, 3)
    ]);
  
    await orderRepository.update(updatedOrderA);
  
    const updatedOrderModelA = await OrderModel.findByPk(orderA.id, {
      include: [OrderItemModel]
    });
  
    expect(updatedOrderModelA).not.toBeNull();
  
    const updatedOrderData = updatedOrderModelA!.toJSON();
    expect(updatedOrderData.customer_id).toEqual('101112');
    expect(updatedOrderData.total).toEqual(45);
    expect(updatedOrderData.items).toHaveLength(1);
    expect(updatedOrderData.items[0].id).toEqual('3');
    expect(updatedOrderData.items[0].name).toEqual('Product B');
    expect(updatedOrderData.items[0].price).toEqual(15);
    expect(updatedOrderData.items[0].product_id).toEqual('789');
    expect(updatedOrderData.items[0].quantity).toEqual(3);
  });
  
  it('should find an existing order', async () => {
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

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
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({ where: { id: '123' } });
    const foundOrder = await orderRepository.find('123');
    expect(orderModel?.toJSON()).toStrictEqual(foundOrder);
  });

  it('should find all existing orders', async () => {
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

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
    await orderRepository.create(order);

    const customer2 = new Customer("132", "Customer 2");
    const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
    customer2.changeAddress(address2);
    await customerRepository.create(customer2);

    const product2 = new Product("123", "Product 1", 10);
    await productRepository.create(product2);

    const orderItem2 = new OrderItem(
      "2",
      product2.name,
      product2.price,
      product2.id,
      2
    );

    const order2 = new Order("2", "132", [orderItem2]);
    await orderRepository.create(order2);

    const foundOrders = await orderRepository.findAll();
    const orders = [order, order2];
    expect(foundOrders).toHaveLength(orders.length);
  });
});
