import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const orders = store.getOrders();
    const products = store.getProducts();
    const tables = store.getTables();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => o.createdAt >= today.getTime());
    const completedOrders = orders.filter(o => o.status === 'completed');
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayRevenue = todayOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrders = orders.filter(o =>
      ['placed', 'accepted', 'preparing'].includes(o.status)
    ).length;

    const productSales: Record<string, number> = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      });
    });

    const popularProducts = Object.entries(productSales)
      .map(([productId, count]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Unknown',
          image: product?.image || '',
          sales: count,
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    const recentOrders = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        tableNumber: o.tableNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.totalAmount,
        createdAt: o.createdAt,
      }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        pendingOrders,
        completedOrders: completedOrders.length,
        popularProducts,
        recentOrders,
        tables: {
          total: tables.length,
          occupied: tables.filter(t => t.status === 'occupied').length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}