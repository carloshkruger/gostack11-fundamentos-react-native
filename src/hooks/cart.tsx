import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const jsonProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (jsonProducts) {
        const productsFromStorage = JSON.parse(jsonProducts);

        setProducts(productsFromStorage);
      }
    }

    loadProducts();
  }, []);

  const setProductsToStorage = useCallback(async () => {
    await AsyncStorage.setItem(
      '@GoMarketplace:products',
      JSON.stringify(products),
    );
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productId = product.id;
      const productExists = products.find(
        productItem => productItem.id === productId,
      );

      if (productExists) {
        setProducts(
          products.map(productItem =>
            productItem.id === productId
              ? { ...productItem, quantity: productItem.quantity + 1 }
              : productItem,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await setProductsToStorage();
    },
    [products, setProductsToStorage],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(productItem =>
          productItem.id === id
            ? { ...productItem, quantity: productItem.quantity + 1 }
            : productItem,
        ),
      );

      await setProductsToStorage();
    },
    [products, setProductsToStorage],
  );

  const decrement = useCallback(
    async id => {
      setProducts(
        products.map(productItem =>
          productItem.id === id
            ? {
                ...productItem,
                quantity:
                  productItem.quantity > 0 ? productItem.quantity - 1 : 0,
              }
            : productItem,
        ),
      );

      await setProductsToStorage();
    },
    [products, setProductsToStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
