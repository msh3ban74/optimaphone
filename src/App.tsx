import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';

/**
 * تُحمَّل الصفحات الثانوية عند الحاجة إليها فحسب، فتبقى الحزمة
 * الأولى صغيرة وسريعة الإقلاع. ولوحة الإدارة كلها في حزمة منفصلة
 * لا تُنزَّل على زائر المتجر إطلاقًا.
 */
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductPage = lazy(() =>
  import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })),
);
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
);
const ConfirmedPage = lazy(() =>
  import('./pages/ConfirmedPage').then((m) => ({ default: m.ConfirmedPage })),
);
const WishlistPage = lazy(() =>
  import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const MerchantPage = lazy(() =>
  import('./pages/MerchantPage').then((m) => ({ default: m.MerchantPage })),
);

const AdminLayout = lazy(() =>
  import('./admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const DashboardView = lazy(() =>
  import('./admin/DashboardView').then((m) => ({ default: m.DashboardView })),
);
const ProductsView = lazy(() =>
  import('./admin/ProductsView').then((m) => ({ default: m.ProductsView })),
);
const ProductEditor = lazy(() =>
  import('./admin/ProductEditor').then((m) => ({ default: m.ProductEditor })),
);
const OrdersView = lazy(() =>
  import('./admin/OrdersView').then((m) => ({ default: m.OrdersView })),
);
const OrderDetailView = lazy(() =>
  import('./admin/OrdersView').then((m) => ({ default: m.OrderDetailView })),
);
const CouponsView = lazy(() =>
  import('./admin/CouponsView').then((m) => ({ default: m.CouponsView })),
);
const SettingsView = lazy(() =>
  import('./admin/SettingsView').then((m) => ({ default: m.SettingsView })),
);
const BackupView = lazy(() =>
  import('./admin/BackupView').then((m) => ({ default: m.BackupView })),
);
const InventoryView = lazy(() =>
  import('./admin/InventoryView').then((m) => ({ default: m.InventoryView })),
);
const CustomersView = lazy(() =>
  import('./admin/CustomersView').then((m) => ({ default: m.CustomersView })),
);
const ReportsView = lazy(() =>
  import('./admin/ReportsView').then((m) => ({ default: m.ReportsView })),
);

function Loading() {
  return <div className="empty" aria-busy="true" />;
}

/** واجهة المتجر: بترويستها وتذييلها وانتقالاتها. */
function Storefront() {
  return (
    <Layout>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/confirmed" element={<ConfirmedPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* لوحة الإدارة بإطارها الخاص، خارج ترويسة المتجر وتذييله. */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="products" element={<ProductsView />} />
          <Route path="products/:id" element={<ProductEditor />} />
          <Route path="inventory" element={<InventoryView />} />
          <Route path="orders" element={<OrdersView />} />
          <Route path="orders/:id" element={<OrderDetailView />} />
          <Route path="customers" element={<CustomersView />} />
          <Route path="coupons" element={<CouponsView />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="tools" element={<MerchantPage />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="backup" element={<BackupView />} />
        </Route>

        <Route path="*" element={<Storefront />} />
      </Routes>
    </Suspense>
  );
}
