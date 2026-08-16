import React, { useState, useCallback } from 'react';
import {
  ShoppingBag,
  Download,
  Star,
  FileText,
  Video,
  Check,
  ArrowRight,
  Plus,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import { CommerceProduct } from '../types';
import { StorageService } from '../services/storage';
import { useLanguage } from '../hooks/useLanguage';
import { useCart } from '../hooks/useCart';
import { MoneyValue } from '../components/common/MoneyValue';

interface CommerceViewProps {
  // Legacy dispatcher callback — optional in the router world.
  onPayEscrow?: (entityType: any, entityId: string, amountBDT: number, title: string) => void;
}

export const CommerceView: React.FC<CommerceViewProps> = ({ onPayEscrow }) => {
  const { t, formatBDT } = useLanguage();
  const { addToCart } = useCart();
  const products = StorageService.getCommerceProducts();
  const [selectedProduct, setSelectedProduct] = useState<CommerceProduct | null>(null);

  // Fallback chain: prop → global withu:open-payment event (consumed by Main.tsx).
  const handlePayEscrow = useCallback(
    (entityType: any, entityId: string, amountBDT: number, title: string) => {
      if (onPayEscrow) {
        onPayEscrow(entityType, entityId, amountBDT, title);
        return;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('withu:open-payment', {
            detail: { entityType, entityId, amountBDT, title }
          }),
        );
      }
    },
    [onPayEscrow],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#111827] text-white p-6 sm:p-10 rounded-3xl shadow-xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[#34C759] bg-[#34C759]/20 px-3 py-1 rounded-full inline-block">
          Digital Assets & Toolkits
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white">Digital Library & Blueprints</h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
          Purchase verified engineering architectural CAD drawings, Bangladeshi legal deed templates, and medical masterclass videos with instant digital access.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="bg-white border border-[#E5E7EB] hover:border-[#34C759] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="relative overflow-hidden h-48 bg-gray-100">
                <img
                  src={prod.thumbnailUrl}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-[#111827]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {prod.productType}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 
                  onClick={() => setSelectedProduct(prod)}
                  className="text-base font-bold text-gray-900 group-hover:text-[#34C759] transition-colors cursor-pointer line-clamp-2"
                >
                  {prod.title}
                </h3>
                <p className="text-xs text-gray-500 font-medium">By {prod.authorName}</p>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{prod.description}</p>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-gray-100 mt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block">Price</span>
                <MoneyValue amount={prod.priceBDT} className="text-lg font-bold text-gray-900" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    addToCart(prod);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Add to Cart
                </button>

                <button
                  onClick={() => handlePayEscrow('COMMERCE', prod.id, prod.priceBDT, prod.title)}
                  className="px-4 py-2 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Buy Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <img
                src={selectedProduct.thumbnailUrl}
                alt={selectedProduct.title}
                className="w-20 h-20 rounded-2xl object-cover"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {selectedProduct.productType}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedProduct.title}</h3>
                <p className="text-xs text-gray-500">Author: {selectedProduct.authorName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <p>{selectedProduct.description}</p>
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0" />
                <span>Instant verified digital file download available upon checkout.</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <MoneyValue amount={selectedProduct.priceBDT} className="text-xl font-bold text-gray-900" />

              <button
                onClick={() => {
                  const p = selectedProduct;
                  setSelectedProduct(null);
                  handlePayEscrow('COMMERCE', p.id, p.priceBDT, p.title);
                }}
                className="px-6 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Instant Buy via bKash / Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommerceView;
