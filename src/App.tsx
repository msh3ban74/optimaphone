import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';

/**
 * تُحمَّل الصفحات الثانوية عند الحاجة إليها فحسب، فتبقى الحزمة
 * الأولى صغيرة وسريعة الإقلاع.
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

function Loading() {
  return <div className="empty" aria-busy="true" />;
}

export default function App() {
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
          <Route path="/merchant" element={<MerchantPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
