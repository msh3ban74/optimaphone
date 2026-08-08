import { Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { ShopPage } from './pages/ShopPage';
import { SuccessPage } from './pages/SuccessPage';
import { WishlistPage } from './pages/WishlistPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/success/:id" element={<SuccessPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  );
}
